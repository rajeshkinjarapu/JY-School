import cv2
import numpy as np

# ============================================================
# PURE COMPUTER VISION OMR ENGINE (NO HARDCODED X, Y)
# Dynamic Contour Bubble Finder & Adaptive Binary Thresholding
# ============================================================

def process_omr_contours(image_path_or_bytes, fill_threshold=0.45):
    """
    Finds all circular bubbles dynamically using Contour Analysis
    No hardcoded X, Y coordinates!
    """
    if isinstance(image_path_or_bytes, str):
        image = cv2.imread(image_path_or_bytes)
    else:
        nparr = np.frombuffer(image_path_or_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image")

    # 1. Convert to Gray and Adaptive Thresholding
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Adaptive thresholding for binary black/white conversion
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 15, 4
    )

    # 2. Find all contours (detect round circular bubbles)
    cnts, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    bubble_cnts = []
    for c in cnts:
        (x, y, w, h) = cv2.boundingRect(c)
        ar = w / float(h)

        # Check if contour is a circle of typical bubble dimensions
        if w >= 12 and h >= 12 and w <= 45 and h <= 45 and 0.75 <= ar <= 1.25:
            bubble_cnts.append(c)

    print(f"Total Circular Bubbles Detected Automatically: {len(bubble_cnts)}")

    # Sort contours Top to Bottom, then Left to Right
    if len(bubble_cnts) > 0:
        # Sort vertically by Y to find rows
        bubble_cnts = sorted(bubble_cnts, key=lambda c: cv2.boundingRect(c)[1])

    # Visualize detected circles
    vis = image.copy()
    for c in bubble_cnts:
        (x, y, w, h) = cv2.boundingRect(c)
        cv2.circle(vis, (x + w//2, y + h//2), max(w, h)//2, (0, 0, 255), 2)

    cv2.imwrite("omr_vision_detected.jpg", vis)
    cv2.imwrite("omr_adaptive_thresh.jpg", thresh)

    return len(bubble_cnts), vis

if __name__ == "__main__":
    count, vis = process_omr_contours("OMR_SAMPLE (1).jpg")
    print(f"Saved omr_vision_detected.jpg with {count} detected circles!")
