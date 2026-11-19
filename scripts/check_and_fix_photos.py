# -*- coding: utf-8 -*-
import os
import sys

folder_path = r"D:\Rajesh\10th Class\Photo & Sign\photos_compressed_180_195kb"

if not os.path.exists(folder_path):
    print(f"[ERROR] Folder not found: {folder_path}")
    sys.exit(1)

print("\n" + "="*58)
print(" 10th Class Photos Dimension Verification (Min: 90x120) ")
print(f" Folder: {folder_path}")
print(" Rule: Width >= 90 px, Height >= 120 px")
print("="*58 + "\n")

try:
    from PIL import Image
except ImportError:
    print("[ERROR] Pillow library is not installed in Python.")
    print("Please run: pip install Pillow OR use the PowerShell script.")
    sys.exit(1)

files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

if not files:
    print("[WARNING] No JPG/PNG images found in this folder!")
    sys.exit(0)

passed = 0
fixed = 0

for filename in files:
    filepath = os.path.join(folder_path, filename)
    try:
        with Image.open(filepath) as img:
            w, h = img.size
            size_kb = round(os.path.getsize(filepath) / 1024, 1)

            if w >= 90 and h >= 120:
                print(f"[PASS] {filename} -> {w} x {h} px ({size_kb} KB)")
                passed += 1
            else:
                print(f"[BELOW MINIMUM] {filename} -> {w} x {h} px (Requirement: Min 90x120)")
                
                scale = max(90.0 / w, 120.0 / h)
                new_w = int(w * scale)
                new_h = int(h * scale)

                resized_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                resized_img.save(filepath, quality=95, optimize=True)
                new_size_kb = round(os.path.getsize(filepath) / 1024, 1)

                print(f"   -> [RESIZED] New Dimensions: {new_w} x {new_h} px ({new_size_kb} KB)")
                fixed += 1
    except Exception as e:
        print(f"[ERROR] {filename} : {str(e)}")

print("\n" + "="*58)
print(" SUMMARY REPORT:")
print(f"   Total Photos Checked: {len(files)}")
print(f"   Already Compliant (Pass): {passed}")
if fixed > 0:
    print(f"   Resized to Meet Min 90x120: {fixed}")
print(" All photos in folder are now compliant (>= 90x120 px)!")
print("="*58 + "\n")
