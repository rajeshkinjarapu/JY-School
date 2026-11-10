import os
import glob
from PIL import Image

src_dir = r"D:\JY School\JY-School-main\flutter_mobile\app icons"
dest_dir = r"D:\JY School\JY-School-main\backend\public\app-icons"

os.makedirs(dest_dir, exist_ok=True)
files = glob.glob(os.path.join(src_dir, "*.png"))

print(f"Found {len(files)} icons to process...")
total_orig = 0
total_new = 0

for file_path in files:
    name = os.path.basename(file_path)
    orig_size = os.path.getsize(file_path)
    total_orig += orig_size
    
    with Image.open(file_path) as im:
        im = im.convert("RGBA")
        im = im.resize((256, 256), Image.Resampling.LANCZOS)
        
        # Save to both locations
        im.save(file_path, "PNG", optimize=True)
        dest_path = os.path.join(dest_dir, name)
        im.save(dest_path, "PNG", optimize=True)
        
    new_size = os.path.getsize(file_path)
    total_new += new_size
    print(f"[OK] {name}: {orig_size/1024:.1f} KB -> {new_size/1024:.1f} KB")

print(f"\nDone! Total size reduced from {total_orig/(1024*1024):.2f} MB to {total_new/(1024*1024):.2f} MB")

