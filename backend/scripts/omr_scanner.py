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
        thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

        # Generate True Black Vision Preview (Threshold Mask)
        # This shows exactly what the AI sees: sheet is black, ink is white
        preview_colored = cv2.cvtColor(thresh, cv2.COLOR_GRAY2BGR)
        _, buffer = cv2.imencode('.jpg', preview_colored, [cv2.IMWRITE_JPEG_QUALITY, 85])
        processed_b64 = base64.b64encode(buffer).decode('utf-8')

        # --- Step 2: Find all bubble contours ---
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Filter contours that look like bubbles (circular, right size)
        min_area = (original_h * original_w) * 0.0001
        max_area = (original_h * original_w) * 0.005
        
        bubbles = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < min_area or area > max_area:
                continue
            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue
            # Re-tightened to ignore handwritten text and lines
            circularity = 4 * np.pi * area / (perimeter * perimeter)
            if circularity < 0.45:  
                continue
            x, y, w, h = cv2.boundingRect(cnt)
            aspect = w / h if h > 0 else 0
            if not (0.6 < aspect < 1.6):  
                continue
            cx = x + w // 2
            cy = y + h // 2
            roi = thresh[y:y+h, x:x+w]
            filled_ratio = cv2.countNonZero(roi) / (w * h) if (w * h) > 0 else 0
            bubbles.append({
                "cx": cx, "cy": cy,
                "x": x, "y": y, "w": w, "h": h,
                "area": area,
                "filled_ratio": filled_ratio,
                "is_filled": filled_ratio > 0.25
            })

        # --- Region Splitting (Student ID vs Questions) ---
        # The Student ID block is located at the top-left portion of the sheet.
        # We can split bubbles by their Y-coordinate.
        id_region_threshold = original_h * 0.28  # Top 28% of the image
        
        id_bubbles = [b for b in bubbles if b["cy"] < id_region_threshold]
        q_bubbles = [b for b in bubbles if b["cy"] >= id_region_threshold]

        # --- Parse Student ID ---
        student_id_str = "AUTO_DETECT"
        if len(id_bubbles) >= 10:  # Assuming at least some ID bubbles found
            id_bubbles.sort(key=lambda b: b["cx"])
            id_x_coords = [b["cx"] for b in id_bubbles]
            id_x_sorted = sorted(set(id_x_coords))
            
            # Find ID columns
            id_gap_threshold = original_w * 0.015
            id_x_clusters = []
            current_cluster = [id_x_sorted[0]]
            for i in range(1, len(id_x_sorted)):
                if id_x_sorted[i] - id_x_sorted[i-1] > id_gap_threshold:
                    id_x_clusters.append(np.mean(current_cluster))
                    current_cluster = [id_x_sorted[i]]
                else:
                    current_cluster.append(id_x_sorted[i])
            id_x_clusters.append(np.mean(current_cluster))
            
            # Group ID bubbles by row (0-9)
            id_bubbles.sort(key=lambda b: b["cy"])
            id_y_coords = [b["cy"] for b in id_bubbles]
            id_y_sorted = sorted(set(id_y_coords))
            id_y_clusters = []
            if id_y_sorted:
                current_cluster = [id_y_sorted[0]]
                for i in range(1, len(id_y_sorted)):
                    if id_y_sorted[i] - id_y_sorted[i-1] > original_h * 0.01:
                        id_y_clusters.append(np.mean(current_cluster))
                        current_cluster = [id_y_sorted[i]]
                    else:
                        current_cluster.append(id_y_sorted[i])
                id_y_clusters.append(np.mean(current_cluster))

            # Read the bubbled digits per column
            parsed_digits = []
            def nearest_cluster(val, clusters):
                return min(range(len(clusters)), key=lambda i: abs(clusters[i] - val))
                
            for col_cx in id_x_clusters:
                # Find all bubbles in this column
                col_bubbles = [b for b in id_bubbles if nearest_cluster(b["cx"], id_x_clusters) == id_x_clusters.index(col_cx)]
                # Find the most filled bubble in this column
                filled_col_bubbles = [b for b in col_bubbles if b["is_filled"]]
                if filled_col_bubbles:
                    best_bubble = max(filled_col_bubbles, key=lambda b: b["filled_ratio"])
                    row_idx = nearest_cluster(best_bubble["cy"], id_y_clusters)
                    # Row 0 usually maps to digit 0, row 1 to 1, etc.
                    parsed_digits.append(str(row_idx))
                else:
                    # Missing digit
                    parsed_digits.append("X")
            
            numeric_part = "".join(parsed_digits)
            clean_digits = numeric_part.replace("X", "")
            
            # Since JY26- is common and they only bubble the remaining 4 digits:
            if len(clean_digits) >= 4:
                # Take the last 4 digits in case it detected some extra noise columns
                student_id_str = f"JY26-{clean_digits[-4:]}"
            else:
                student_id_str = f"JY26-{numeric_part}"

        # --- Step 4: Group QUESTION bubbles into columns (A, B, C, D options) ---
        if not q_bubbles:
            return {
                "error": "No question bubbles detected. Ensure scanning area is clear.",
                "processed_image": processed_b64
            }

        q_bubbles.sort(key=lambda b: b["cx"])
        x_coords = [b["cx"] for b in q_bubbles]
        x_sorted = sorted(set(x_coords))
        
        # Find X clusters for questions
        gap_threshold = original_w * 0.02
        x_clusters = []
        current_cluster = [x_sorted[0]]
        for i in range(1, len(x_sorted)):
            if x_sorted[i] - x_sorted[i-1] > gap_threshold:
                x_clusters.append(np.mean(current_cluster))
                current_cluster = [x_sorted[i]]
            else:
                current_cluster.append(x_sorted[i])
        x_clusters.append(np.mean(current_cluster))

        num_x_clusters = len(x_clusters)
        def nearest_cluster(cx, clusters):
            return min(range(len(clusters)), key=lambda i: abs(clusters[i] - cx))

        for b in q_bubbles:
            b["col_idx"] = nearest_cluster(b["cx"], x_clusters)

        # --- Step 5: Group QUESTION bubbles by Y (rows = question numbers) ---
        q_bubbles.sort(key=lambda b: b["cy"])
        y_coords = [b["cy"] for b in q_bubbles]
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

        for b in q_bubbles:
            b["row_idx"] = nearest_cluster(b["cy"], y_clusters)

        # --- Step 6: Build a grid and detect answers ---
        num_rows = len(y_clusters)
        num_cols = len(x_clusters)

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
        for group_idx in range(question_col_groups):
            base_col = group_idx * options_per_q
            for row_idx in range(num_rows):
                q_num += 1
                row_group_bubbles = [
                    b for b in q_bubbles
                    if b["row_idx"] == row_idx and (base_col <= b["col_idx"] < base_col + options_per_q)
                ]

                if not row_group_bubbles:
                    detected_answers[str(q_num)] = "-"
                    continue

                row_group_bubbles.sort(key=lambda b: b["cx"])
                filled_bubbles = [b for b in row_group_bubbles if b["is_filled"]]
                
                if len(filled_bubbles) == 0:
                    selected_answer = "-"
                elif len(filled_bubbles) > 1:
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

                # Score calculation (No negative marks: +4 correct, 0 wrong)
                correct_ans = answer_key.get(str(q_num))
                if selected_answer not in ["-", "DOUBTFUL"] and correct_ans:
                    if selected_answer == correct_ans:
                        marks = 4
                        correct += 1
                    else:
                        marks = 0  # No negative marks
                        wrong += 1
                else:
                    marks = 0

                if q_num <= 25:
                    maths += marks
                elif q_num <= 50:
                    physics += marks
                else:
                    chemistry += marks

        return {
            "success": True,
            "student_id": student_id_str,
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
