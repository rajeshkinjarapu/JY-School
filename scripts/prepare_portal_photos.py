# -*- coding: utf-8 -*-
import os
import sys

src_folder = r"D:\Rajesh\10th Class\Photo & Sign\photos_compressed_180_195kb"
out_folder1 = r"D:\Rajesh\10th Class\Photo & Sign\photos_portal_ready_150x200"
out_folder2 = r"D:\Rajesh\10th Class\Photo & Sign\photos_portal_exact_90x120"

if not os.path.exists(src_folder):
    print(f"[ERROR] Source folder not found: {src_folder}")
    sys.exit(1)

os.makedirs(out_folder1, exist_ok=True)
os.makedirs(out_folder2, exist_ok=True)

try:
    from PIL import Image
except ImportError:
    print("[ERROR] Pillow library not installed. Please use PowerShell script.")
    sys.exit(1)

print("\n" + "="*58)
print(" Generating Portal-Compliant Student Photos")
print(f" Source: {src_folder}")
print(f" Output 1 (HD >90x120): {out_folder1}")
print(f" Output 2 (Exact 90x120): {out_folder2}")
print("="*58 + "\n")

files = [f for f in os.listdir(src_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
count = 0

for filename in files:
    src_path = os.path.join(src_folder, filename)
    dest_path1 = os.path.join(out_folder1, filename)
    dest_path2 = os.path.join(out_folder2, filename)

    try:
        with Image.open(src_path) as img:
            rgb_img = img.convert('RGB')

            # Option 1: 150x200 px (HD, above 90x120, ~30-45 KB)
            img1 = rgb_img.resize((150, 200), Image.Resampling.LANCZOS)
            img1.save(dest_path1, 'JPEG', quality=90, optimize=True)

            # Option 2: 90x120 px (Exact 90by120, ~15-25 KB)
            img2 = rgb_img.resize((90, 120), Image.Resampling.LANCZOS)
            img2.save(dest_path2, 'JPEG', quality=90, optimize=True)

            sz1 = round(os.path.getsize(dest_path1) / 1024, 1)
            sz2 = round(os.path.getsize(dest_path2) / 1024, 1)

            print(f"[OK] {filename} -> 150x200 ({sz1} KB) & 90x120 ({sz2} KB)")
            count += 1
    except Exception as e:
        print(f"[ERROR] {filename}: {str(e)}")

print("\n" + "="*58)
print(" COMPLETED SUCCESSFULLY!")
print(f" Total Photos Processed: {count}")
print(f" Option 1 Folder (150x200 px, 30-45 KB):\n   {out_folder1}")
print(f" Option 2 Folder (Exact 90x120 px, 15-25 KB):\n   {out_folder2}")
print(" Original 180-195 KB files are completely safe & untouched!")
print("="*58 + "\n")
