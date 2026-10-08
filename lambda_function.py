"""
EcoScan AWS Lambda Function Handler (Python 3.10+)
Ideal for AWS Serverless deployments (AWS API Gateway + Lambda).
The GEMINI_API_KEY is configured in AWS Lambda Environment Variables,
keeping your key 100% secret while public hackathon code stays on GitHub.
"""

import json
import os
import urllib.request
import urllib.error

def get_api_keys():
    keys = []
    # 1. Comma-separated list: GEMINI_API_KEYS="key1,key2,key3"
    raw_keys = os.environ.get("GEMINI_API_KEYS", "") or os.environ.get("GEMINI_API_KEY", "")
    if raw_keys:
        keys.extend([k.strip() for k in raw_keys.split(",") if k.strip()])
    
    # 2. Individual indexed keys: GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3
    for name in ["GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3"]:
        k = os.environ.get(name, "").strip()
        if k:
            keys.append(k)

    # Deduplicate preserving order
    seen = set()
    deduped = []
    for k in keys:
        if k not in seen:
            seen.add(k)
            deduped.append(k)
    return deduped

def lambda_handler(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Content-Type": "application/json"
    }

    # Handle CORS Preflight
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"status": "ok"})
        }

    keys = get_api_keys()
    if not keys:
        return {
            "statusCode": 503,
            "headers": headers,
            "body": json.dumps({
                "error": "No GEMINI_API_KEY configured in AWS Lambda environment variables."
            })
        }

    try:
        body = json.loads(event.get("body", "{}"))
        image_base64 = body.get("imageBase64")

        if not image_base64:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "imageBase64 is required in request body"})
            }

        prompt = """You are an expert waste classification and computer vision engine. Analyze the entire input image to detect waste items, piles, and litter.

Strict output requirements:
- Do not output JSON, markdown code fences, conversational greetings, or closing remarks.
- Provide output strictly divided into two sections using exact headers: "### BACKEND_DATA" and "### FRONTEND_REPORT".
- Normalize all bounding box coordinates to integers between 0 and 1000: [ymin, xmin, ymax, xmax] relative to image height and width.

Allowed Categories:
- Recyclable (Plastics, Metals, Paper, Cardboard, Clean Glass)
- Organic (Food scraps, Yard waste, Biodegradable)
- Hazardous (Batteries, E-waste, Chemicals, Medical)
- Non-Recyclable (Mixed residual waste, Multi-layer packaging, Debris)

Output format structure:

### BACKEND_DATA
[item_name]|[category]|[ymin]|[xmin]|[ymax]|[xmax]

(Rules for BACKEND_DATA:
1. One detected object per line.
2. Separate exactly 6 fields using a single pipe character (|).
3. Do not include column header rows or extra spaces around the pipes.
4. Ensure ymin < ymax and xmin < xmax.)

### FRONTEND_REPORT
[Provide a concise 3-4 sentence operational summary:
- Primary waste composition and notable detected materials.
- Contamination or hazard level (Low/Medium/High) with clear rationale.
- Actionable site status: Recommended bin routing or required remediation priority.]"""

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_base64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "topP": 0.95,
                "maxOutputTokens": 2048
            }
        }

        def parse_waste_detection_response(raw_text):
            """Parse pipe-delimited BACKEND_DATA and FRONTEND_REPORT from Gemini text response."""
            import re
            backend_match = re.search(
                r'###\s*BACKEND_DATA\s*\n([\s\S]*?)(?=###\s*FRONTEND_REPORT|$)',
                raw_text, re.IGNORECASE
            )
            frontend_match = re.search(
                r'###\s*FRONTEND_REPORT\s*\n([\s\S]*?)$',
                raw_text, re.IGNORECASE
            )

            detected_items = []
            if backend_match and backend_match.group(1):
                for line in backend_match.group(1).strip().split('\n'):
                    line = line.strip()
                    if not line:
                        continue
                    parts = line.split('|')
                    if len(parts) != 6:
                        continue
                    item_name, category, ymin_s, xmin_s, ymax_s, xmax_s = parts
                    try:
                        ymin, xmin, ymax, xmax = int(ymin_s), int(xmin_s), int(ymax_s), int(xmax_s)
                    except ValueError:
                        continue
                    if ymin >= ymax or xmin >= xmax:
                        continue
                    detected_items.append({
                        "item_name": item_name.strip(),
                        "category": category.strip(),
                        "bbox": {"ymin": ymin, "xmin": xmin, "ymax": ymax, "xmax": xmax}
                    })

            frontend_report = (
                frontend_match.group(1).strip()
                if frontend_match and frontend_match.group(1)
                else "Scene analyzed. No additional report available."
            )
            return detected_items, frontend_report

        # Multi-Key Auto-Swap Loop: Try each key until one succeeds
        last_error = ""
        for idx, key in enumerate(keys):
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )

            try:
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode("utf-8"))

                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                detected_items, frontend_report = parse_waste_detection_response(raw_text)

                return {
                    "statusCode": 200,
                    "headers": headers,
                    "body": json.dumps({
                        "success": True,
                        "source": "gemini_vision_ai",
                        "activeKeyIndex": idx + 1,
                        "totalKeys": len(keys),
                        "result": {
                            "detectedItems": detected_items,
                            "frontendReport": frontend_report,
                            "raw": raw_text
                        }
                    })
                }

            except urllib.error.HTTPError as err:
                status_code = err.code
                error_body = err.read().decode("utf-8", errors="ignore")
                last_error = f"HTTP {status_code}: {error_body}"
                
                # Check for rate-limiting / quota exhaustion (HTTP 429 / 403)
                if status_code in (429, 403) and idx < len(keys) - 1:
                    print(f"[API Key Limit Reached] Key #{idx + 1} exhausted. Auto-swapping to key #{idx + 2}...")
                    continue
                else:
                    if idx < len(keys) - 1:
                        print(f"[Key Failed] Key #{idx + 1} returned {status_code}. Trying next key...")
                        continue

        return {
            "statusCode": 502,
            "headers": headers,
            "body": json.dumps({
                "error": f"All {len(keys)} Gemini API keys failed or exhausted: {last_error}"
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
