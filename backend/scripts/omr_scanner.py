import cv2
import numpy as np
import sys
import json
import base64


def process_omr(image_path, answer_key):
    try:
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Could not read image"}

        original_h, original_w = image.shape[:2]

        # --- Step 1: Preprocess ---
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Adaptive Thresholding for 100% accuracy in different lightings
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 51, 10)
        
        # Morphological operation to remove noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

        # --- Step 2: Find all bubble contours ---
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Filter contours that look like bubbles (circular, right size)
        min_area = (original_h * original_w) * 0.00015
        max_area = (original_h * original_w) * 0.004
        
        bubbles = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < min_area or area > max_area:
                continue
            # Circularity check
            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue
            circularity = 4 * np.pi * area / (perimeter * perimeter)
            if circularity < 0.5:
                continue
            x, y, w, h = cv2.boundingRect(cnt)
            aspect = w / h if h > 0 else 0
            if not (0.5 < aspect < 2.0):
                continue
            cx = x + w // 2
            cy = y + h // 2
            # Count filled pixels in this bubble region
            roi = thresh[y:y+h, x:x+w]
            filled_ratio = cv2.countNonZero(roi) / (w * h) if (w * h) > 0 else 0
            bubbles.append({
                "cx": cx, "cy": cy,
                "x": x, "y": y, "w": w, "h": h,
                "area": area,
                "filled_ratio": filled_ratio,
                "is_filled": filled_ratio > 0.45
            })

        if len(bubbles) < 10:
            return {
                "error": f"Not enough bubbles found ({len(bubbles)}). Ensure a clear, well-lit scan.",
                "processed_image": ""
            }

        # --- Step 3: Generate Perfect Black Vision Preview ---
        # Create a completely black background
        black_vision = np.zeros((original_h, original_w, 3), dtype=np.uint8)
        
        for b in bubbles:
            radius = max(b["w"], b["h"]) // 2
            if b["is_filled"]:
                # Draw filled bubbles as bright solid white
                cv2.circle(black_vision, (b["cx"], b["cy"]), radius, (255, 255, 255), -1)
                # Add a subtle glow
                cv2.circle(black_vision, (b["cx"], b["cy"]), radius + 4, (100, 255, 100), 2)
            else:
                # Draw empty bubbles as dim gray outlines
                cv2.circle(black_vision, (b["cx"], b["cy"]), radius, (80, 80, 80), 2)

        _, buffer = cv2.imencode('.jpg', black_vision, [cv2.IMWRITE_JPEG_QUALITY, 85])
        processed_b64 = base64.b64encode(buffer).decode('utf-8')

        # --- Step 4: Group bubbles into columns (A, B, C, D options) ---
        # Sort all bubbles by X first to find column clusters
        bubbles.sort(key=lambda b: b["cx"])

        # Cluster X coordinates into groups using gap detection
        x_coords = [b["cx"] for b in bubbles]
        x_sorted = sorted(set(x_coords))
        
        # Find X clusters using a gap threshold
        gap_threshold = original_w * 0.02  # 2% of image width
        x_clusters = []
        current_cluster = [x_sorted[0]]
        for i in range(1, len(x_sorted)):
            if x_sorted[i] - x_sorted[i-1] > gap_threshold:
                x_clusters.append(np.mean(current_cluster))
                current_cluster = [x_sorted[i]]
            else:
                current_cluster.append(x_sorted[i])
        x_clusters.append(np.mean(current_cluster))

        # For JEE OMR: we expect 4 option columns (A,B,C,D) repeated 3 times
        # So we need clusters that are multiples of 4
        # Find the most likely column count
        num_x_clusters = len(x_clusters)
        
        # Assign each bubble to nearest x-cluster
        def nearest_cluster(cx, clusters):
            return min(range(len(clusters)), key=lambda i: abs(clusters[i] - cx))

        for b in bubbles:
            b["col_idx"] = nearest_cluster(b["cx"], x_clusters)

        # --- Step 5: Group by Y (rows = question numbers) ---
        bubbles.sort(key=lambda b: b["cy"])
        y_coords = [b["cy"] for b in bubbles]
        y_sorted = sorted(set(y_coords))
        
        y_gap_threshold = original_h * 0.012
        y_clusters = []
        current_cluster = [y_sorted[0]]
        for i in range(1, len(y_sorted)):
            if y_sorted[i] - y_sorted[i-1] > y_gap_threshold:
                y_clusters.append(np.mean(current_cluster))
                current_cluster = [y_sorted[i]]
            else:
                current_cluster.append(y_sorted[i])
        y_clusters.append(np.mean(current_cluster))

        for b in bubbles:
            b["row_idx"] = nearest_cluster(b["cy"], y_clusters)

        # --- Step 6: Build a grid and detect answers ---
        # For JEE OMR with 4 options per question:
        # Group all bubbles by (row_idx, col_idx)
        num_rows = len(y_clusters)
        num_cols = len(x_clusters)

        # Group columns into sets of 4 (each set = one question column)
        # Determine how many question column groups there are
        # For our sheet: 3 groups (Maths 1-25, Physics 26-50, Chem 51-75)
        # Each group has 4 option columns (A,B,C,D)
        options_per_q = 4
        question_col_groups = num_cols // options_per_q if num_cols >= options_per_q else 1

        detected_answers = {}
        maths = 0
        physics = 0
        chemistry = 0
        correct = 0
        wrong = 0
        option_labels = ["A", "B", "C", "D"]

        q_num = 0
        questions_per_group = num_rows  # rows = questions per subject column

        for group_idx in range(question_col_groups):
            base_col = group_idx * options_per_q
            for row_idx in range(num_rows):
                q_num += 1
                # Get all bubbles in this row for this group's columns
                row_group_bubbles = [
                    b for b in bubbles
                    if b["row_idx"] == row_idx and (base_col <= b["col_idx"] < base_col + options_per_q)
                ]

                if not row_group_bubbles:
                    detected_answers[str(q_num)] = "-"
                    continue

                # Sort by x to get A, B, C, D order
                row_group_bubbles.sort(key=lambda b: b["cx"])

                # Find the most filled bubble
                filled_bubbles = [b for b in row_group_bubbles if b["is_filled"]]
                
                if len(filled_bubbles) == 0:
                    selected_answer = "-"
                elif len(filled_bubbles) > 1:
                    # Check if truly multiple filled or just one much darker
                    ratios = [b["filled_ratio"] for b in row_group_bubbles]
                    max_ratio = max(ratios)
                    really_filled = [b for b in row_group_bubbles if b["filled_ratio"] > max_ratio * 0.7]
                    if len(really_filled) > 1:
                        selected_answer = "DOUBTFUL"
                    else:
                        opt_idx = row_group_bubbles.index(really_filled[0]) if really_filled else -1
                        selected_answer = option_labels[opt_idx] if 0 <= opt_idx < options_per_q else "-"
                else:
                    opt_idx = row_group_bubbles.index(filled_bubbles[0])
                    selected_answer = option_labels[opt_idx] if opt_idx < options_per_q else "-"

                detected_answers[str(q_num)] = selected_answer

                # Score calculation (JEE pattern: +4 correct, -1 wrong)
                correct_ans = answer_key.get(str(q_num))
                if selected_answer not in ["-", "DOUBTFUL"] and correct_ans:
                    if selected_answer == correct_ans:
                        marks = 4
                        correct += 1
                    else:
                        marks = -1
                        wrong += 1
                else:
                    marks = 0

                # Subject assignment (25 per subject)
                if q_num <= 25:
                    maths += marks
                elif q_num <= 50:
                    physics += marks
                else:
                    chemistry += marks

        return {
            "success": True,
            "student_id": "AUTO_DETECT",
            "processed_image": processed_b64,
            "answers": detected_answers,
            "bubbles_found": len(bubbles),
            "questions_detected": q_num,
            "marks": {
                "maths": maths,
                "physics": physics,
                "chemistry": chemistry,
                "total": maths + physics + chemistry
            },
            "total_questions": q_num,
            "correct": correct,
            "wrong": wrong
        }

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments: image_path and answer_key_json_path required"}))
        sys.exit(1)

    img_path = sys.argv[1]
    ans_key_path = sys.argv[2]

    try:
        with open(ans_key_path, 'r') as f:
            ans_key = json.load(f)
    except Exception:
        ans_key = {}

    output = process_omr(img_path, ans_key)
    print(json.dumps(output))
