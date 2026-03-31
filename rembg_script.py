from PIL import Image, ImageDraw
import sys
import glob

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    
    # We want to make the background transparent. The background is a white/grey studio backdrop.
    # The subject (Junior) is wearing a white shirt, so simple color keying might erase her shirt!
    # FloodFill from the edges is much safer.
    
    # Create a mask
    mask = Image.new('L', img.size, 0)
    ImageDraw.floodfill(img, (0, 0), (255, 0, 255, 255), thresh=45)
    ImageDraw.floodfill(img, (img.width-1, 0), (255, 0, 255, 255), thresh=45)
    ImageDraw.floodfill(img, (0, img.height-1), (255, 0, 255, 255), thresh=45)
    ImageDraw.floodfill(img, (img.width-1, img.height-1), (255, 0, 255, 255), thresh=45)
    
    data = img.getdata()
    new_data = []
    
    # The floodfill replaced the background with Magenta (255, 0, 255)
    for item in data:
        if item[0] == 255 and item[1] == 0 and item[2] == 255:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Resize so it's optimized for WebGL (e.g. max 1024 height)
    aspect = img.width / img.height
    new_h = 1024
    new_w = int(new_h * aspect)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    img.save(out_path, "PNG")
    print(f"Saved {out_path}")

front_path = glob.glob("/Users/toni/Downloads/時間裡的兩個妳/2005年學妹定稿/2005年學妹正面長袖襯衫定稿.*g")[0]
side_path = glob.glob("/Users/toni/Downloads/時間裡的兩個妳/2005年學妹定稿/2005年學妹左側長袖襯衫定稿.*g")[0]
back_path = glob.glob("/Users/toni/Downloads/時間裡的兩個妳/2005年學妹定稿/2005年學妹背面長袖襯衫定稿.*g")[0]

out_dir = "/Users/toni/Downloads/時間裡的兩個妳/assets/lm402/"
remove_white_bg(front_path, out_dir + "junior_2005_front.png")
remove_white_bg(side_path, out_dir + "junior_2005_side.png")
remove_white_bg(back_path, out_dir + "junior_2005_back.png")
