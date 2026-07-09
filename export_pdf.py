from playwright.sync_api import sync_playwright
import time
from PIL import Image
import io

def run():
    screenshots = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2 # Retina quality
        )
        page = context.new_page()
        
        print("Loading presentation...")
        page.goto('file:///Users/ikhaisoshuare/Cascade/presentation.html')
        
        # Allow the first slide to animate
        time.sleep(4)
        print("Capturing slide 1...")
        screenshots.append(Image.open(io.BytesIO(page.screenshot(type='jpeg', quality=100))))
        
        # Press right arrow to advance slides, pausing for animations
        for i in range(10):
            page.keyboard.press('ArrowRight')
            time.sleep(4) # Wait for animation to finish before next slide
            print(f"Capturing slide {i+2}...")
            screenshots.append(Image.open(io.BytesIO(page.screenshot(type='jpeg', quality=100))))
            
        page.close()
        context.close()
        browser.close()
        
        # Save as PDF
        if screenshots:
            pdf_path = "/Users/ikhaisoshuare/Cascade/Morlen_Pitch_Deck_Final.pdf"
            # Ensure images are in RGB format for PDF saving
            rgb_screenshots = [img.convert('RGB') for img in screenshots]
            
            rgb_screenshots[0].save(
                pdf_path, "PDF", resolution=100.0, save_all=True, append_images=rgb_screenshots[1:]
            )
            print(f"PDF successfully exported to {pdf_path}")

if __name__ == '__main__':
    run()
