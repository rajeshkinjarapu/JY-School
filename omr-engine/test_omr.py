import cv2
import numpy as np

# Load exact high-res Master Template
img = cv2.imread("../OMR Student ID Dots.jpg")
TARGET_W = 1200
TARGET_H = 1600

sheet = cv2.resize(img, (TARGET_W, TARGET_H))
gray = cv2.cvtColor(sheet, cv2.COLOR_BGR2GRAY)

print(f"Master Sheet Dimensions: {sheet.shape[1]}x{sheet.shape[0]}")

# Scan Student ID Row 0 Y center
id_y_starts = []
for y in range(180, 240):
    val = np.mean(gray[y-2:y+2, 115:130])
    if val < 200:
        id_y_starts.append((y, val))

if id_y_starts:
    min_y = min(id_y_starts, key=lambda item: item[1])[0]
    print(f"Detected Student ID Row '0' Y Center = {min_y}")

# Scan Question Q01 Y center
q_y_starts = []
for y in range(710, 770):
    val = np.mean(gray[y-2:y+2, 125:140])
    if val < 200:
        q_y_starts.append((y, val))

if q_y_starts:
    min_q_y = min(q_y_starts, key=lambda item: item[1])[0]
    print(f"Detected Q01 Bubble Y Center = {min_q_y}")
