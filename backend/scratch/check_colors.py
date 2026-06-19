import os
from PIL import Image

def inspect_image(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    img = Image.open(path)
    print(f"=== Inspecting processed {os.path.basename(path)} ===")
    print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
    img_rgba = img.convert("RGBA")
    datas = list(img_rgba.getdata())
    
    # Check if there are transparent pixels
    transparent_pixels = [p for p in datas if p[3] < 255]
    print(f"Transparent pixels: {len(transparent_pixels)} / {len(datas)}")
    
    # Check unique colors in corners
    corners = [datas[0], datas[img.size[0] - 1], datas[len(datas) - img.size[0]], datas[len(datas) - 1]]
    print(f"Corner pixels: {corners}")

def main():
    public_dir = 'd:/VSCode/Pookie AI/frontend/public'
    inspect_image(os.path.join(public_dir, 'female.png'))
    inspect_image(os.path.join(public_dir, 'male.png'))
    inspect_image(os.path.join(public_dir, 'trans.png'))

if __name__ == '__main__':
    main()
