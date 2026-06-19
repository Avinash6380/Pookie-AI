import os
from PIL import Image

def remove_background(image_path, target_path, tolerance=30):
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return

    # Load image and ensure it is RGBA
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()

    # Determine background color by looking at top-left corner pixel
    bg_color = datas[0]
    print(f"Processing {os.path.basename(image_path)}...")
    print(f"Detected background color at corner: {bg_color[:3]}")

    new_data = []
    for item in datas:
        # Check if the pixel color is close to the background color
        r_diff = abs(item[0] - bg_color[0])
        g_diff = abs(item[1] - bg_color[1])
        bg_diff = abs(item[2] - bg_color[2])
        
        # If the pixel is close to background, make it transparent
        if r_diff < tolerance and g_diff < tolerance and bg_diff < tolerance:
            new_data.append((0, 0, 0, 0))  # Transparent
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(target_path, "PNG")
    print(f"SUCCESS: Background removed and saved to {target_path}\n")

def main():
    public_dir = 'd:/VSCode/Pookie AI/frontend/public'
    
    images = [
        'female.png',
        'male.png',
        'trans.png'
    ]
    
    for img_name in images:
        path = os.path.join(public_dir, img_name)
        remove_background(path, path)

if __name__ == '__main__':
    main()
