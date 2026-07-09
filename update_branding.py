import sys

new_css = """    :root {
      /* MORLEN BRAND AESTHETIC */
      --bg-gradient: radial-gradient(circle at 50% 0%, #1A1525 0%, #0A0A0F 100%);
      --bg-solid: #0A0A0F;
      
      --text: #F1F5F9;
      --text-muted: #64748B;
      --accent: #A855F7; 
      --accent-alt: #6366F1;
      
      --card-bg: #12121A;
      --card-glass: rgba(255, 255, 255, 0.03);
      --border: rgba(255, 255, 255, 0.06);
      --border-highlight: rgba(168, 85, 247, 0.3);
      
      --shadow-soft: 0 24px 80px rgba(0, 0, 0, 0.8);
      --ease: cubic-bezier(0.22, 1, 0.36, 1);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-solid);
      background-image: var(--bg-gradient);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Morlen Brand Orb Glow */
    body::before {
      content: "";
      position: fixed;
      top: -20vh;
      left: 20vw;
      width: 60vw;
      height: 60vw;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      animation: pulse 6s infinite alternate ease-in-out;
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.05); opacity: 1; }
    }

    #presentation {
      position: relative;
      width: 100%;
      height: 100%;
    }

    /* BASE SLIDE MECHANICS */
    .slide {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      padding: 4rem 6rem;
      visibility: hidden;
      z-index: 1;
    }
    .slide.active {
      visibility: visible;
      z-index: 10;
    }

    /* IN-PAGE ANIMATION CHOREOGRAPHY */
    .slide > div, .slide > header, .slide > main {
      opacity: 0;
      transform: translateY(40px) scale(0.98);
      filter: blur(8px);
      transition: opacity 1000ms var(--ease), transform 1200ms var(--ease), filter 1000ms var(--ease);
    }
    
    .slide.active > div:nth-child(1), .slide.active > header:nth-child(1), .slide.active > main:nth-child(1) { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition-delay: 150ms; }
    .slide.active > div:nth-child(2), .slide.active > header:nth-child(2), .slide.active > main:nth-child(2) { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition-delay: 350ms; }
    .slide.active > div:nth-child(3), .slide.active > header:nth-child(3), .slide.active > main:nth-child(3) { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition-delay: 550ms; }

    .anim-seq > * {
      opacity: 0;
      transform: translateY(30px) scale(0.98);
      filter: blur(4px);
      transition: opacity 800ms var(--ease), transform 1000ms var(--ease), filter 800ms var(--ease);
    }
    .slide.active .anim-seq > *:nth-child(1) { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition-delay: 450ms; }
    .slide.active .anim-seq > *:nth-child(2) { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition-delay: 650ms; }
    .slide.active .anim-seq > *:nth-child(3) { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition-delay: 850ms; }
    .slide.active .anim-seq > *:nth-child(4) { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition-delay: 1050ms; }
    .slide.active .anim-seq > *:nth-child(5) { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition-delay: 1250ms; }

    /* TYPOGRAPHY */
    .headline {
      font-family: 'Playfair Display', serif;
      font-weight: 400;
      font-size: 4rem;
      line-height: 1.05;
      letter-spacing: -0.03em;
      color: var(--text);
    }
    .headline strong, .headline em {
      font-style: italic;
      color: var(--accent);
      font-weight: 400;
    }

    .subhead {
      font-family: 'Inter', sans-serif;
      font-weight: 300;
      font-size: 1.5rem;
      color: var(--text-muted);
      margin-top: 2rem;
      max-width: 800px;
      line-height: 1.6;
      letter-spacing: -0.01em;
    }

    .slide-kicker {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--accent);
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      display: inline-block;
    }

    /* LAYOUTS */
    .layout-asymmetric {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 6rem;
      align-items: center;
      height: 100%;
    }
    
    .layout-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      height: 100%;
    }

    /* CARDS & CHAT BUBBLES */
    .chat-card {
      background: var(--card-glass);
      border: 1px solid var(--border);
      border-top: 1px solid var(--border-highlight);
      padding: 2.5rem;
      border-radius: 24px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      margin-bottom: 2rem;
      box-shadow: var(--shadow-soft);
    }

    .chat-meta {
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .chat-text {
      font-family: 'Playfair Display', serif;
      font-size: 1.6rem;
      color: var(--text);
      line-height: 1.4;
    }
    
    .chat-response {
      color: var(--accent);
      font-style: italic;
    }

    /* BOARD GRID */
    .board-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3rem;
      margin-top: 3rem;
      width: 100%;
    }
    
    .agent-card {
      padding: 2.5rem;
      background: var(--card-glass);
      border: 1px solid var(--border);
      border-radius: 16px;
      backdrop-filter: blur(12px);
    }
    
    .agent-name {
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: var(--accent);
    }
    
    .agent-insight {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      line-height: 1.4;
      color: var(--text);
    }

    /* PIPELINE FLOW */
    .flow-diagram {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;
      margin-top: 5rem;
      padding-top: 3rem;
      border-top: 1px solid var(--border);
    }
    .flow-step {
      text-align: left;
      flex: 1;
      padding-right: 2rem;
      position: relative;
    }
    .flow-step::after {
      content: "→";
      position: absolute;
      right: 0.5rem;
      top: 0;
      color: var(--border);
      font-size: 1.5rem;
    }
    .flow-step:last-child::after {
      display: none;
    }
    .flow-title {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 1.2rem;
      color: var(--text);
      margin-bottom: 0.5rem;
    }
    .flow-desc {
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    
    /* MORLEN LOGO WATERMARK */
    .morlen-watermark {
      position: fixed;
      bottom: 3rem;
      right: 4rem;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: var(--text);
      opacity: 0.15;
      z-index: 50;
      pointer-events: none;
    }
"""

slide_6_replacement = """<!-- SLIDE 6: Retention -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Why businesses keep using Morlen</div>
      </header>
      <main class="layout-center" style="padding-top: 2rem;">
        <div class="anim-seq" style="display: flex; align-items: center; justify-content: center; gap: 1rem; width: 100%; max-width: 1400px; margin-top: 2rem;">
          
          <div style="flex: 1; background: var(--card-glass); border: 1px solid var(--border); border-radius: 16px; padding: 3rem 2rem; text-align: center; backdrop-filter: blur(12px);">
            <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 1rem;">Week 1</div>
            <div style="font-family: 'Playfair Display', serif; font-size: 4rem; color: var(--text); margin-bottom: 0.5rem; line-height: 1;">20</div>
            <div style="font-family: 'Inter', sans-serif; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted);">Conversations</div>
          </div>
          
          <div style="color: var(--border-highlight); font-size: 2rem;">→</div>

          <div style="flex: 1; background: var(--card-glass); border: 1px solid var(--border); border-radius: 16px; padding: 3rem 2rem; text-align: center; backdrop-filter: blur(12px);">
            <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 1rem;">Month 2</div>
            <div style="font-family: 'Playfair Display', serif; font-size: 4.5rem; color: var(--text); margin-bottom: 0.5rem; line-height: 1;">400</div>
            <div style="font-family: 'Inter', sans-serif; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted);">Conversations</div>
          </div>
          
          <div style="color: var(--border-highlight); font-size: 2rem;">→</div>

          <div style="flex: 1.2; background: rgba(168, 85, 247, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 4rem 2rem; text-align: center; backdrop-filter: blur(12px); box-shadow: 0 0 40px rgba(168,85,247,0.1);">
            <div style="font-family: 'Inter', sans-serif; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); margin-bottom: 1rem; font-weight: 600;">Month 6</div>
            <div style="font-family: 'Playfair Display', serif; font-size: 5.5rem; color: var(--text); margin-bottom: 0.5rem; line-height: 1;">3,000</div>
            <div style="font-family: 'Inter', sans-serif; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted);">Interactions</div>
          </div>
          
        </div>
        
        <div class="anim-seq" style="display: flex; align-items: center; justify-content: center; gap: 4rem; margin-top: 5rem; border-top: 1px solid var(--border-highlight); padding-top: 4rem; width: 100%;">
           <div style="text-align: center;">
             <div style="font-family: 'Playfair Display', serif; font-size: 2.5rem; color: var(--text); margin-bottom: 0.5rem;">Business Memory</div>
             <div style="font-family: 'Inter', sans-serif; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--accent); font-weight: 600;">Deep Context</div>
           </div>
           
           <div style="font-size: 2.5rem; color: var(--border-highlight);">+</div>
           
           <div style="text-align: center;">
             <div style="font-family: 'Playfair Display', serif; font-size: 2.5rem; color: var(--text); margin-bottom: 0.5rem;">Smarter</div>
             <div style="font-family: 'Inter', sans-serif; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--accent); font-weight: 600;">Recommendations</div>
           </div>
        </div>
      </main>
    </section>"""

with open('/Users/ikhaisoshuare/Cascade/presentation.html', 'r') as f:
    html = f.read()

# Replace CSS
start_css = html.find('    :root {')
end_css = html.find('  </style>')
if start_css != -1 and end_css != -1:
    html = html[:start_css] + new_css + html[end_css:]

# Replace all wrong rgba styles inline
html = html.replace('rgba(56, 189, 248,', 'rgba(168, 85, 247,')
html = html.replace('rgba(226, 121, 83,', 'rgba(168, 85, 247,')

# Replace Slide 6
import re
# Regex to match slide 6 block
slide_6_pattern = re.compile(r'<!-- SLIDE 6: Retention -->.*?</section>', re.DOTALL)
html = slide_6_pattern.sub(slide_6_replacement, html)

# Inject the watermark logo right before the closing body tag
watermark = '\n  <div class="morlen-watermark">MORLEN</div>\n'
if 'morlen-watermark' not in html:
    html = html.replace('</body>', watermark + '</body>')

with open('/Users/ikhaisoshuare/Cascade/presentation.html', 'w') as f:
    f.write(html)

print("Branding completely overhauled.")
