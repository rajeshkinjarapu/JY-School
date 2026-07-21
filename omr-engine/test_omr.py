import cv2
import numpy as np

# ============================================================
# PURE COMPUTER VISION OMR SCANNER ENGINE
# Dynamic Contour Grid Clustering - 0% Hardcoded Coordinates
# ============================================================

def scan_omr_computer_vision(image_path):
    image = cv2.imread(image_path)
    if image is None:
        print("Image not found!")
        return

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 4)

    # Find all contours (Circles)
    cnts, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    bubbles = []
    for c in cnts:
        (x, y, w, h) = cv2.boundingRect(c)
        ar = w / float(h)
        # Filter circular contours of bubble sizes
        if 12 <= w <= 45 and 12 <= h <= 45 and 0.75 <= ar <= 1.25:
            bubbles.append((x, y, w, h, c))

    print(f"==================================================")
    print(f" Dynamic Vision Detected {len(bubbles)} Circle Bubbles!")
    print(f"==================================================")

    # Sort bubbles into Rows by Y coordinate
    bubbles = sorted(bubbles, key=lambda b: b[1])

    # Cluster into Question Rows
    rows = []
    curr_row = []
    last_y = -1

    for b in bubbles:
        if last_y == -1 or abs(b[1] - last_y) < 14:
            curr_row.append(b)
            last_y = b[1]
        else:
            rows.append(sorted(curr_row, key=lambda b: b[0]))
            curr_row = [b]
            last_y = b[1]
    if curr_row:
        rows.append(sorted(curr_row, key=lambda b: b[0]))

    # Draw detected circular bubbles on output image
    vis = image.copy()
    filled_bubbles = 0

    for r_idx, r in enumerate(rows):
        # Determine filled bubble in this row by mask non-zero pixel count
        for (x, y, w, h, c) in r:
            mask = np.zeros(thresh.shape, dtype="uint8")
            cv2.drawContours(mask, [c], -1, 255, -1)
            mask = cv2.bitwise_and(thresh, thresh, mask=mask)
            total = cv2.countNonZero(mask)

            # High non-zero count means filled bubble
            if total > (w * h * 0.45):
                cv2.circle(vis, (x + w//2, y + h//2), max(w, h)//2, (0, 0, 255), 3) # Red Circle
                filled_bubbles += 1
            else:
                cv2.circle(vis, (x + w//2, y + h//2), max(w, h)//2, (0, 255, 0), 1) # Green Circle

    cv2.imwrite("omr_pure_vision_result.jpg", vis)
    print(f"Total Filled Dark Bubbles Identified: {filled_bubbles}")
    print("Saved omr_pure_vision_result.jpg")

if __name__ == "__main__":
    scan_omr_computer_vision("../OMR_SAMPLE (1).jpg")
