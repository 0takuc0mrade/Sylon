from playwright.sync_api import sync_playwright
import time
import os
import glob
import shutil

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir="/Users/ikhaisoshuare/Cascade",
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()
        
        print("Loading presentation...")
        page.goto('file:///Users/ikhaisoshuare/Cascade/presentation.html')
        
        # Allow the first slide to animate
        time.sleep(4)
        
        print("Recording slides...")
        # Press right arrow to advance slides, pausing for animations
        for i in range(10):
            page.keyboard.press('ArrowRight')
            time.sleep(5.5) # Wait for animation to finish before next slide
            
        print("Finalizing video...")
        time.sleep(4) # Let final slide sit
        
        # Get video path before closing page
        video_path = page.video.path()
        
        page.close()
        context.close()
        browser.close()
        
        # Rename the random webm to a deterministic name
        final_webm = "/Users/ikhaisoshuare/Cascade/Sylon_Pitch_Deck_Final.webm"
        if os.path.exists(final_webm):
            os.remove(final_webm)
        shutil.move(video_path, final_webm)
        
        print(f"Video successfully recorded to {final_webm}")

if __name__ == '__main__':
    run()
