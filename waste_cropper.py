"""
waste_cropper.py
────────────────────────────────────────────────────────────────────────────────
High-performance, fault-tolerant OpenCV module for cropping waste detections
from vision model output.

Compatible with the EcoScan Gemini Vision backend (server.js / lambda_function.py).
Vision model output format expected:

    ### BACKEND_DATA
    item_name|category|ymin|xmin|ymax|xmax
    ...

    ### FRONTEND_REPORT
    Plain English operational summary.

Usage:
    from waste_cropper import process_and_crop_waste

    result = process_and_crop_waste(
        image_input="scene.jpg",         # or a numpy ndarray
        raw_model_response=gemini_text,
        output_dir="crops"
    )
    print(result["frontend_report"])
    for det in result["detections"]:
        print(det["item_name"], det["crop_path"])
"""

import os
import re
import logging
from pathlib import Path
from typing import Union

import cv2
import numpy as np

# ── Module-level logger ──────────────────────────────────────────────────────
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("[waste_cropper] %(levelname)s: %(message)s"))
    logger.addHandler(_handler)


# ── Section header patterns ───────────────────────────────────────────────────
_RE_BACKEND  = re.compile(r"###\s*BACKEND_DATA\s*\n([\s\S]*?)(?=###\s*FRONTEND_REPORT|$)", re.IGNORECASE)
_RE_FRONTEND = re.compile(r"###\s*FRONTEND_REPORT\s*\n([\s\S]*?)$", re.IGNORECASE)

# Characters that are unsafe in filenames on any major OS
_UNSAFE_CHARS = re.compile(r"[^\w\-]")


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _load_image(image_input: Union[str, np.ndarray]) -> np.ndarray:
    """
    Accept either a filesystem path (str / Path) or a pre-loaded ndarray.

    Raises:
        TypeError         – image_input is an unrecognised type.
        FileNotFoundError – path does not exist on disk.
        ValueError        – file exists but cv2 could not decode it.
    """
    if isinstance(image_input, np.ndarray):
        if image_input.ndim < 2:
            raise ValueError("Provided ndarray has fewer than 2 dimensions – not a valid image.")
        logger.debug("image_input accepted as pre-loaded ndarray, shape=%s", image_input.shape)
        return image_input

    if isinstance(image_input, (str, Path)):
        path = str(image_input)
        if not os.path.isfile(path):
            raise FileNotFoundError(f"Image file not found: {path!r}")
        img = cv2.imread(path)
        if img is None:
            raise ValueError(
                f"cv2.imread returned None for {path!r}. "
                "File may be corrupt, truncated, or in an unsupported format."
            )
        logger.debug("Loaded image from %r, shape=%s", path, img.shape)
        return img

    raise TypeError(
        f"image_input must be a file path (str/Path) or numpy.ndarray, "
        f"got {type(image_input).__name__!r}."
    )


def _sanitize_filename(text: str, max_length: int = 40) -> str:
    """
    Replace unsafe filename characters with underscores and enforce a max length.
    Collapses consecutive underscores and strips leading/trailing ones.
    """
    safe = _UNSAFE_CHARS.sub("_", text.strip())
    safe = re.sub(r"_+", "_", safe).strip("_")
    return safe[:max_length] if safe else "unknown"


def _parse_backend_data(raw_response: str) -> list:
    """
    Extract and parse the BACKEND_DATA section from the raw model response.

    Each valid line must have exactly 6 pipe-separated tokens:
        item_name | category | ymin | xmin | ymax | xmax

    Malformed lines are skipped with a debug-level log entry.

    Returns a list of detection dicts:
        { "item_name": str, "category": str, "bbox": [ymin, xmin, ymax, xmax] }
    """
    backend_match = _RE_BACKEND.search(raw_response)
    if not backend_match:
        logger.warning("### BACKEND_DATA section not found in model response.")
        return []

    block = backend_match.group(1)
    detections = []

    for line_no, raw_line in enumerate(block.splitlines(), start=1):
        line = raw_line.strip()

        # Skip blank lines and stray header echoes
        if not line or line.startswith("#"):
            continue

        tokens = line.split("|")
        if len(tokens) != 6:
            logger.debug(
                "Line %d skipped – expected 6 pipe-delimited tokens, got %d: %r",
                line_no, len(tokens), line,
            )
            continue

        item_name, category, ymin_s, xmin_s, ymax_s, xmax_s = tokens

        try:
            ymin = int(ymin_s.strip())
            xmin = int(xmin_s.strip())
            ymax = int(ymax_s.strip())
            xmax = int(xmax_s.strip())
        except ValueError as exc:
            logger.debug("Line %d skipped – coordinate parse error: %s", line_no, exc)
            continue

        # Validate normalised range (0–1000) and non-degenerate box
        if not (0 <= ymin < ymax <= 1000 and 0 <= xmin < xmax <= 1000):
            logger.debug(
                "Line %d skipped – degenerate or out-of-range bbox: "
                "ymin=%d xmin=%d ymax=%d xmax=%d",
                line_no, ymin, xmin, ymax, xmax,
            )
            continue

        detections.append({
            "item_name": item_name.strip(),
            "category":  category.strip(),
            "bbox":      [ymin, xmin, ymax, xmax],
        })

    logger.debug("Parsed %d valid detection(s) from BACKEND_DATA.", len(detections))
    return detections


def _parse_frontend_report(raw_response: str) -> str:
    """
    Extract the plain-English FRONTEND_REPORT from the raw model response.
    Falls back to a neutral message if the section is absent or empty.
    """
    frontend_match = _RE_FRONTEND.search(raw_response)
    if frontend_match and frontend_match.group(1).strip():
        return frontend_match.group(1).strip()
    logger.warning("### FRONTEND_REPORT section not found or empty.")
    return "Scene analyzed. No additional report available."


def _denormalize_and_clamp(
    ymin_n, xmin_n, ymax_n, xmax_n,
    img_height, img_width,
):
    """
    Convert 0-1000 normalized coordinates to pixel coordinates,
    then clamp strictly within image bounds.

    Returns (py_min, px_min, py_max, px_max).
    """
    py_min = int((ymin_n / 1000.0) * img_height)
    px_min = int((xmin_n / 1000.0) * img_width)
    py_max = int((ymax_n / 1000.0) * img_height)
    px_max = int((xmax_n / 1000.0) * img_width)

    # Clamp to image bounds
    py_min = max(0, min(py_min, img_height))
    px_min = max(0, min(px_min, img_width))
    py_max = max(0, min(py_max, img_height))
    px_max = max(0, min(px_max, img_width))

    return py_min, px_min, py_max, px_max


def _save_crop(
    image,
    py_min, px_min, py_max, px_max,
    output_dir,
    index,
    category,
    item_name,
):
    """
    Slice the crop from `image`, write it as a JPEG to `output_dir`, and
    return the saved file path.  Returns None if the crop is zero-area or
    if cv2.imwrite fails.
    """
    # Guard: non-degenerate pixel box after clamping
    if py_max <= py_min or px_max <= px_min:
        logger.debug(
            "Detection #%d skipped – zero-area pixel box after denormalisation "
            "(py_min=%d px_min=%d py_max=%d px_max=%d).",
            index, py_min, px_min, py_max, px_max,
        )
        return None

    crop = image[py_min:py_max, px_min:px_max]

    safe_category  = _sanitize_filename(category)
    safe_item_name = _sanitize_filename(item_name)
    filename       = f"{index}_{safe_category}_{safe_item_name}.jpg"
    filepath       = os.path.join(output_dir, filename)

    # JPEG encode at quality 92 – good balance of fidelity vs. size
    success = cv2.imwrite(filepath, crop, [cv2.IMWRITE_JPEG_QUALITY, 92])
    if not success:
        logger.error("cv2.imwrite failed for %r – check permissions and disk space.", filepath)
        return None

    logger.debug("Saved crop #%d -> %r  (h=%d w=%d)", index, filepath, crop.shape[0], crop.shape[1])
    return filepath


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def process_and_crop_waste(
    image_input: Union[str, np.ndarray],
    raw_model_response: str,
    output_dir: str = "crops",
) -> dict:
    """
    End-to-end pipeline: parse model output -> denormalize boxes -> crop -> save.

    Parameters
    ----------
    image_input : str | numpy.ndarray
        Either a filesystem path to the source image, or an already-loaded
        BGR ndarray from cv2.imread().
    raw_model_response : str
        Raw text returned by the Gemini vision model containing
        ``### BACKEND_DATA`` and ``### FRONTEND_REPORT`` sections.
    output_dir : str, optional
        Directory where cropped JPEG images will be written.
        Created automatically if it does not exist. Default: ``"crops"``.

    Returns
    -------
    dict
        crops_saved     (int)        – number of JPEG files successfully written.
        crop_paths      (list[str])  – absolute paths of all written files.
        frontend_report (str)        – the FRONTEND_REPORT text from the model.
        detections      (list[dict]) – one entry per valid detection:
            {
                "item_name"  : str,
                "category"   : str,
                "bbox"       : [ymin, xmin, ymax, xmax],  # normalised 0-1000
                "crop_path"  : str | None                  # None if save failed
            }
    """
    # ── 1. Load image ─────────────────────────────────────────────────────────
    image = _load_image(image_input)
    img_height, img_width = image.shape[:2]
    logger.info("Processing image  h=%d  w=%d", img_height, img_width)

    # ── 2. Parse model response ───────────────────────────────────────────────
    detections_raw  = _parse_backend_data(raw_model_response)
    frontend_report = _parse_frontend_report(raw_model_response)

    if not detections_raw:
        logger.info("No valid detections found; returning empty result.")
        return {
            "crops_saved":     0,
            "crop_paths":      [],
            "frontend_report": frontend_report,
            "detections":      [],
        }

    # ── 3. Ensure output directory exists ─────────────────────────────────────
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    logger.debug("Output directory ready: %r", output_dir)

    # ── 4. Crop & save loop ───────────────────────────────────────────────────
    result_detections = []
    crop_paths = []

    for idx, det in enumerate(detections_raw):
        ymin_n, xmin_n, ymax_n, xmax_n = det["bbox"]

        py_min, px_min, py_max, px_max = _denormalize_and_clamp(
            ymin_n, xmin_n, ymax_n, xmax_n, img_height, img_width
        )

        crop_path = _save_crop(
            image      = image,
            py_min     = py_min,
            px_min     = px_min,
            py_max     = py_max,
            px_max     = px_max,
            output_dir = output_dir,
            index      = idx,
            category   = det["category"],
            item_name  = det["item_name"],
        )

        if crop_path is not None:
            crop_paths.append(crop_path)

        result_detections.append({
            "item_name": det["item_name"],
            "category":  det["category"],
            "bbox":      det["bbox"],      # normalised 0-1000
            "crop_path": crop_path,        # None if write failed
        })

    crops_saved = len(crop_paths)
    logger.info(
        "Done. %d/%d detection(s) cropped successfully -> %r",
        crops_saved, len(detections_raw), output_dir,
    )

    return {
        "crops_saved":     crops_saved,
        "crop_paths":      crop_paths,
        "frontend_report": frontend_report,
        "detections":      result_detections,
    }


# ─────────────────────────────────────────────────────────────────────────────
# CLI smoke-test  (python waste_cropper.py image.jpg response.txt)
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    import json

    logging.basicConfig(level=logging.DEBUG)

    if len(sys.argv) < 3:
        print("Usage: python waste_cropper.py <image_path> <response_txt_path> [output_dir]")
        sys.exit(1)

    _img_path      = sys.argv[1]
    _response_path = sys.argv[2]
    _out_dir       = sys.argv[3] if len(sys.argv) > 3 else "crops"

    with open(_response_path, "r", encoding="utf-8") as fh:
        _raw = fh.read()

    _result = process_and_crop_waste(
        image_input        = _img_path,
        raw_model_response = _raw,
        output_dir         = _out_dir,
    )

    print("\n── Result ─────────────────────────────────────")
    print(json.dumps(_result, indent=2))
