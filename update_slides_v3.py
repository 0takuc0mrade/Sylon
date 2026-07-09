import sys

html_content = """<!-- SLIDE 1: Vision -->
    <section class="slide active">
      <div class="layout-center">
        <h1 class="headline" style="font-size: 5.5rem; max-width: 1200px; margin-bottom: 2rem;">Businesses don't have a data problem.</h1>
        <h1 class="headline" style="font-size: 5.5rem; max-width: 1200px; color: var(--text-muted);">They have a decision problem.</h1>
      </div>
    </section>

    <!-- SLIDE 2: Problem -->
    <section class="slide">
      <header>
         <div class="slide-kicker">The Value of Conversation</div>
      </header>
      <main class="layout-asymmetric" style="gap: 4rem;">
        <div>
          <h2 class="headline" style="font-size: 4rem; line-height: 1.1; margin-bottom: 2rem;">Customer interactions are more valuable than we think.</h2>
          <div style="margin-top: 4rem;">
             <p style="font-family: 'Inter', sans-serif; font-size: 1.8rem; color: var(--text-muted); line-height: 1.6;">Individually, they're just conversations.</p>
             <p style="font-family: 'Inter', sans-serif; font-size: 1.8rem; color: var(--accent); line-height: 1.6; margin-top: 1rem; font-weight: 500;">Together, they're telling you how your business should evolve.</p>
          </div>
        </div>
        <div class="anim-seq" style="display: flex; flex-direction: column; gap: 2rem; padding-top: 1rem;">
          <div class="chat-card" style="margin: 0;">
            <div class="chat-text" style="font-size: 1.6rem;">"How much?"</div>
          </div>
          <div class="chat-card" style="margin: 0; background: rgba(226, 121, 83, 0.05);">
            <div class="chat-text" style="font-size: 1.6rem; color: var(--text-muted);">"Do you deliver?"</div>
          </div>
          <div class="chat-card" style="margin: 0;">
            <div class="chat-text" style="font-size: 1.6rem;">"Do you have Oraimo?"</div>
          </div>
          <div class="chat-card" style="margin: 0; border-color: rgba(226, 121, 83, 0.3);">
            <div class="chat-text" style="font-size: 1.6rem; color: var(--accent);">"It's too expensive."</div>
          </div>
        </div>
      </main>
    </section>

    <!-- SLIDE 3: Transition -->
    <section class="slide">
      <main class="layout-center">
        <h2 class="headline" style="font-size: 4.5rem; max-width: 1000px; margin-bottom: 4rem; line-height: 1.2;">What if every customer interaction made your business smarter?</h2>
        
        <div class="anim-seq" style="margin-top: 4rem; border-top: 1px solid var(--border-highlight); padding-top: 4rem;">
           <div style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 3rem; text-transform: uppercase; letter-spacing: 0.4em; color: var(--text); opacity: 0.9; margin-bottom: 2rem;">Meet Morlen</div>
           <p style="font-family: 'Inter', sans-serif; font-size: 1.6rem; color: var(--text-muted); max-width: 800px; margin: 0 auto; line-height: 1.6;">
              Every business already has customer data. The businesses that win over the next decade will be the ones that learn from it faster.
           </p>
        </div>
      </main>
    </section>

    <!-- SLIDE 4: Solution -->
    <section class="slide">
      <header>
         <div class="slide-kicker">How Morlen Thinks</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; padding-top: 2rem;">
        <h2 class="headline" style="font-size: 3.5rem; margin-bottom: 3rem;">Reasoning, not just processing.</h2>
        <div class="board-grid anim-seq" style="width: 100%; border-top: 1px solid var(--border); padding-top: 3rem;">
          <div class="agent-card">
            <div class="agent-name">Observation</div>
            <div class="agent-insight">"12 people requested Oraimo chargers this week. We don't stock them."</div>
          </div>
          <div class="agent-card">
            <div class="agent-name">Contextual Debate</div>
            <div class="agent-insight">CX Agent: "Customers are leaving."<br/><br/>Ops Agent: "Supplier restocks on Fridays."</div>
          </div>
          <div class="agent-card" style="border-color: var(--accent); background: rgba(226, 121, 83, 0.05);">
            <div class="agent-name" style="color: var(--accent);">Active Recommendation</div>
            <div class="agent-insight" style="color: var(--text);">"Order Oraimo inventory before Friday to capture lost WhatsApp demand."</div>
          </div>
        </div>
      </main>
    </section>

    <!-- SLIDE 5: Product Demo -->
    <section class="slide">
      <main class="layout-center">
        <h1 class="headline" style="font-size: 8rem; letter-spacing: -0.04em; color: var(--text); opacity: 0.9;">Live Demo.</h1>
      </main>
    </section>

    <!-- SLIDE 6: Retention -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Why businesses keep using Morlen</div>
      </header>
      <main class="layout-center" style="padding-top: 4rem;">
        <div class="flow-diagram anim-seq" style="padding-top: 2rem; width: 100%; justify-content: space-between;">
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title">Week 1</div>
            <div class="flow-desc">20<br/>conversations</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--text-muted);">Month 2</div>
            <div class="flow-desc">400<br/>conversations</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--text);">Month 6</div>
            <div class="flow-desc">3,000<br/>interactions</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--accent);">Business Memory</div>
            <div class="flow-desc">Deep Context</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--accent); font-weight: 700;">Smarter</div>
            <div class="flow-desc">Recommendations</div>
          </div>
        </div>
      </main>
    </section>

    <!-- SLIDE 7: The Opportunity -->
    <section class="slide">
      <header>
         <div class="slide-kicker">The Opportunity</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; text-align: left; padding-top: 4rem;">
        <div class="anim-seq" style="max-width: 1000px;">
           <h2 class="headline" style="font-size: 4rem; margin-bottom: 3rem; line-height: 1.2;">Nigeria has millions of businesses already communicating through WhatsApp, Facebook, and Instagram.</h2>
           
           <h2 class="headline" style="font-size: 3.5rem; margin-bottom: 3rem; line-height: 1.2; color: var(--text-muted);">Every day they generate customer interactions.</h2>
           
           <h2 class="headline" style="font-size: 3.5rem; margin-bottom: 3rem; line-height: 1.2; color: var(--accent);">Almost none of those interactions become structured business knowledge.</h2>
        </div>
      </main>
    </section>

    <!-- SLIDE 8: Business Model -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Building a sustainable business</div>
      </header>
      <main class="layout-center" style="padding-top: 4rem;">
        <div class="flow-diagram anim-seq" style="padding-top: 2rem; width: 100%; justify-content: space-between;">
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title">Businesses</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--text-muted);">Subscriptions</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--text);">Enterprise</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--accent);">Integrations</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--accent); font-weight: 700;">Platform</div>
          </div>
        </div>
      </main>
    </section>

    <!-- SLIDE 9: Traction -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Progress so far</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; text-align: left; padding-top: 2rem;">
        <div class="anim-seq" style="width: 100%;">
            <ul style="font-family: 'Inter', sans-serif; font-size: 1.8rem; list-style: none; padding: 0; line-height: 3; color: var(--text);">
              <li>✅ Functional web platform (Live on Vercel)</li>
              <li>✅ Multi-agent AI architecture</li>
              <li>✅ Built using Qwen</li>
              <li>✅ Live demo ready</li>
              <li>✅ Invited to pitch to business audience</li>
              <li>✅ Product roadmap completed</li>
            </ul>
        </div>
      </main>
    </section>

    <!-- SLIDE 10: Roadmap -->
    <section class="slide">
      <header>
         <div class="slide-kicker">What's next</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; text-align: left; padding-top: 2rem;">
        <h2 class="headline" style="font-size: 4rem; margin-bottom: 4rem;">Roadmap</h2>
        <div class="anim-seq" style="width: 100%; display: flex; flex-direction: row; flex-wrap: wrap; gap: 2rem; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; font-size: 1.4rem;">
             
             <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 1rem 2rem; border-radius: 8px;">Customer Reviews</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">→</div>
             
             <div style="background: rgba(226, 121, 83, 0.1); border: 1px solid var(--accent); padding: 1rem 2rem; border-radius: 8px; color: var(--text);">Business Memory</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">→</div>
             
             <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 1rem 2rem; border-radius: 8px;">WhatsApp</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">→</div>
             
             <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 1rem 2rem; border-radius: 8px;">Instagram</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">→</div>
             
             <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 1rem 2rem; border-radius: 8px;">Facebook</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">→</div>
             
             <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 1rem 2rem; border-radius: 8px;">Voice Notes</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">→</div>
             
             <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 1rem 2rem; border-radius: 8px;">Inventory</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">→</div>
             
             <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 1rem 2rem; border-radius: 8px; color: var(--text-muted);">Enterprise Intelligence</div>
        </div>
      </main>
    </section>

    <!-- SLIDE 11: Join Us -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Join Us</div>
      </header>
      <main class="layout-asymmetric" style="gap: 8rem; padding-top: 4rem;">
        <div>
           <h3 class="headline" style="font-size: 4.5rem; margin-bottom: 2rem; line-height: 1.1;">We are looking for...</h3>
           <p style="font-family: 'Inter', sans-serif; font-size: 1.6rem; color: var(--text-muted); max-width: 800px; line-height: 1.6; margin-top: 2rem;">
              Every business already has customer data. The businesses that win over the next decade will be the ones that learn from it faster.
           </p>
        </div>
        <div class="anim-seq">
          <div style="margin-bottom: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 2rem;">
            <div class="chat-text" style="font-size: 2.5rem; color: var(--text);">Pilot Businesses</div>
          </div>
          <div style="margin-bottom: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 2rem;">
            <div class="chat-text" style="font-size: 2.5rem; color: var(--text);">Strategic Partners</div>
          </div>
          <div style="margin-bottom: 3rem; border-bottom: 1px solid var(--border); padding-bottom: 2rem;">
            <div class="chat-text" style="font-size: 2.5rem; color: var(--text);">Investors</div>
          </div>
          <div>
            <div class="chat-text" style="font-size: 2.5rem; color: var(--text);">Collaborators</div>
          </div>
        </div>
      </main>
    </section>"""

with open('/Users/ikhaisoshuare/Cascade/presentation.html', 'r') as f:
    content = f.read()

start_idx = content.find('<!-- SLIDE 1:')
end_idx = content.find('  </div>\n\n  <script>')

new_content = content[:start_idx] + html_content + '\n' + content[end_idx:]

with open('/Users/ikhaisoshuare/Cascade/presentation.html', 'w') as f:
    f.write(new_content)
