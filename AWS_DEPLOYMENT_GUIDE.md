# EcoScan AWS Deployment & Security Guide

## 1. Security Architecture (Why the API Key Must Stay on AWS)

For hackathon submissions where your GitHub repository is public:
- **Never put your `GEMINI_API_KEY` into frontend code or `.env` pushed to GitHub.**
- If committed publicly, Google’s automated secret scanning will detect the key within minutes and revoke it, and competitors or third parties can hijack your quota.
- `.gitignore` is already configured in this repo to automatically ignore `.env` files.

```
┌─────────────────────────────────┐
│ Client Browser (Public Web App) │
│ - Camera snapshot / photo upload│
└────────────────┬────────────────┘
                 │ POST /api/classify (Image base64 only - NO API KEY)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ AWS Server (EC2 / ECS / App Runner / Lambda)                │
│ - Reads GEMINI_API_KEY from AWS Environment Variables       │
│ - Securely calls Google Gemini 1.5 Flash Vision API         │
└────────────────┬────────────────────────────────────────────┘
                 │ Secure Server-to-Server HTTPS Request
                 ▼
┌─────────────────────────────────┐
│ Google Gemini 1.5 Flash Vision  │
│ Returns JSON waste categorization│
└─────────────────────────────────┘
```

---

## 2. Option A: Deploying on AWS EC2 / App Runner / Elastic Beanstalk (Node.js)

1. **Clone your public GitHub repo** onto your AWS EC2 instance:
   ```bash
   git clone <YOUR_PUBLIC_REPO_URL>
   cd AWS-Phase-2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set your 3 API keys in the server environment**:
   You can either create a local `.env` file on the server (which is automatically git-ignored and protected):
   ```bash
   cat << 'EOF' > .env
   PORT=3000
   GEMINI_API_KEYS=your_key1_here,your_key2_here,your_key3_here
   EOF
   ```
   Or set them individually:
   ```bash
   cat << 'EOF' > .env
   PORT=3000
   GEMINI_API_KEY_1=your_key1_here
   GEMINI_API_KEY_2=your_key2_here
   GEMINI_API_KEY_3=your_key3_here
   EOF
   ```

4. **Run with PM2 (Daemon for production)**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name ecoscan
   ```
   *Auto-Swap Behavior*: The server starts on Key #1. As soon as Key #1 encounters a rate limit (HTTP 429) or quota exhaustion (`RESOURCE_EXHAUSTED`), it logs `[API Key Limit Reached]`, immediately retries the request using Key #2, and subsequent requests use Key #2. If Key #2 runs out, it smoothly moves to Key #3!

---

## 3. Option B: Deploying on AWS Lambda (Serverless Python)

If you are using **AWS API Gateway + AWS Lambda**:
1. Create a Python 3.10+ Lambda function.
2. Paste the code from [`lambda_function.py`](./lambda_function.py).
3. In the AWS Lambda Console, navigate to **Configuration** → **Environment variables**:
   - Key: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key_here`
4. Add an API Gateway HTTP/REST trigger with route `POST /api/classify`.

---

## 4. Local Testing & Verification

1. When opening [`index.html`](./index.html) directly without a running backend:
   - The app uses its local embedded waste database as an offline fallback so you can always demonstrate the UI smoothly.
2. When running with the backend server (`npm start` with `GEMINI_API_KEY` set):
   - Real-time snapshots trigger live Google Gemini 1.5 Flash vision classification with sub-second response times.
