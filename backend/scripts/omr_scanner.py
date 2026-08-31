import cv2
import numpy as np
import sys
import json
import imutils
from imutils.perspective import four_point_transform

def process_omr(image_path, answer_key_json):
    try:
        # Load the image
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Could not read image"}

        # Basic preprocessing
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 75, 200)

        # Find contours (document outline)
        cnts = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        docCnt = None

        if len(cnts) > 0:
            cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
            for c in cnts:
                peri = cv2.arcLength(c, True)
                approx = cv2.approxPolyDP(c, 0.02 * peri, True)
                if len(approx) == 4:
                    docCnt = approx
                    break

        if docCnt is None:
            # Fallback: Just use the whole image if no outline found
            h, w = image.shape[:2]
            docCnt = np.array([[[0, 0]], [[w, 0]], [[w, h]], [[0, h]]])

        # Apply perspective transform to get a top-down bird's-eye view
        paper = four_point_transform(image, docCnt.reshape(4, 2))
        warped = four_point_transform(gray, docCnt.reshape(4, 2))

        # Threshold the warped image
        thresh = cv2.threshold(warped, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

        # In a real scenario, we use precise coordinates (Bounding Boxes) based on the specific template.
        # Here we mock the result for the demonstration as we need to tune the coordinates using a real scan.
        # Return mock parsed data for now to connect the Flutter UI to the Backend successfully.
        
        # Logic: 75 questions * 4 marks = 300 marks
        # Breakdown: 25 Maths (100), 25 Physics (100), 25 Chemistry (100)
        result = {
            "success": True,
            "student_id": "SVJ12345",
            "marks": {
                "maths": 80,       # e.g., 20 correct * 4
                "physics": 76,     # e.g., 19 correct * 4
                "chemistry": 92,   # e.g., 23 correct * 4
                "total": 248       # 80 + 76 + 92
            },
            "total_questions": 75,
            "correct": 62,         # 62 * 4 = 248
            "wrong": 13
        }

        return result

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)

    img_path = sys.argv[1]
    ans_key_raw = sys.argv[2]
    
    try:
        ans_key = json.loads(ans_key_raw)
    except:
        ans_key = {}

    output = process_omr(img_path, ans_key)
    print(json.dumps(output))
