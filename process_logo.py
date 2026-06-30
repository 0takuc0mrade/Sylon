from PIL import Image, ImageOps

# Load the uploaded logo image
img_path = '/Users/ikhaisoshuare/.gemini/antigravity/brain/8a8fea10-e24c-496e-b832-e87faea5a11d/media__1782855755083.jpg'
img = Image.open(img_path).convert('L') # Convert to grayscale

# The image has a light background and dark text.
# We map 240-255 to 0 (background) and 0-240 to 255-0.
# First, invert the image so text is white and background is black
img_inv = ImageOps.invert(img)

# Now apply a curve: any value below 15 (which was 240 before invert) becomes 0
# Anything above becomes stretched.
def map_pixel(p):
    if p < 15:
        return 0
    # Stretch 15-255 to 0-255
    val = min(255, int((p - 15) * (255.0 / 240.0) * 1.5))
    return val

alpha = img_inv.point(map_pixel)

# Create a solid color image for the text
# Pure white so it acts as a frosted texture
color_img = Image.new('RGB', img.size, color=(255, 255, 255))

# Merge using alpha
color_img.putalpha(alpha)

# Save as transparent PNG
output_path = '/Users/ikhaisoshuare/Cascade/sylon_logo_transparent.png'
color_img.save(output_path, 'PNG')

print("Logo processed and saved to", output_path)
