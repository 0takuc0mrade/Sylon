import sys

html_content = """<!-- SLIDE 1: Vision -->
    <section class="slide active">
      <div class="layout-center">
        <h1 class="headline" style="font-size: 8rem; letter-spacing: -0.04em;">Morlen</h1>
        <p class="subhead" style="font-size: 2.5rem; margin-top: 1rem; color: var(--text);">Behavioral Intelligence for Better Business Decisions</p>
        <div style="position: absolute; bottom: 4rem; width: 100%; text-align: center;">
            <p style="font-family: 'Inter', sans-serif; font-size: 1.4rem; color: var(--text-muted);">Transforming customer interactions into business intelligence.</p>
        </div>
      </div>
    </section>

    <!-- SLIDE 2: Problem -->
    <section class="slide">
      <header>
         <div class="slide-kicker">The Problem</div>
      </header>
      <main class="layout-asymmetric" style="gap: 4rem;">
        <div>
          <h2 class="headline" style="font-size: 4.5rem; line-height: 1.1; margin-bottom: 2rem;">Businesses generate intelligence every day.<br/><span style="color: var(--text-muted)">They just don't capture it.</span></h2>
        </div>
        <div class="anim-seq" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; padding-top: 1rem;">
          <div style="border-right: 1px solid var(--border); padding-right: 3rem;">
            <ul style="font-family: 'Inter', sans-serif; font-size: 1.8rem; list-style: none; padding: 0; line-height: 2.5; color: var(--text);">
              <li>WhatsApp</li>
              <li>Facebook</li>
              <li>Instagram</li>
              <li>Reviews</li>
              <li>Walk-in conversations</li>
            </ul>
          </div>
          <div>
            <ul style="font-family: 'Inter', sans-serif; font-size: 1.8rem; list-style: none; padding: 0; line-height: 2.5; color: var(--text-muted);">
              <li>❌ Forgotten</li>
              <li>❌ Scattered</li>
              <li>❌ No pattern recognition</li>
              <li>❌ Decisions based on instinct</li>
            </ul>
          </div>
        </div>
        <div style="position: absolute; bottom: 4rem; width: 100%; max-width: 1200px; border-top: 1px solid var(--border-highlight); padding-top: 2rem;">
            <p style="font-family: 'Inter', sans-serif; font-size: 1.4rem; color: var(--accent);">14 million Nigerian SMEs already use Meta platforms to run and grow their businesses.</p>
        </div>
      </main>
    </section>

    <!-- SLIDE 3: Opportunity -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Opportunity</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; text-align: left; padding-top: 2rem;">
        <h2 class="headline" style="font-size: 4.5rem; margin-bottom: 4rem;">The market already exists.</h2>
        <div class="board-grid anim-seq" style="width: 100%; border-top: 1px solid var(--border); padding-top: 3rem; margin-top: 0;">
          <div class="agent-card" style="border: none; padding: 0;">
            <div class="chat-text" style="font-size: 3rem; color: var(--text); margin-bottom: 1rem;">40 million</div>
            <div class="chat-meta">MSMEs</div>
            <p style="font-family: 'Inter', sans-serif; color: var(--text-muted); font-size: 1.2rem; margin-top: 1rem; line-height: 1.6;">Nigeria has roughly 40 million MSMEs, contributing about 45–46% of GDP and over 96% of businesses.</p>
          </div>
          <div class="agent-card" style="border: none; padding: 0;">
            <div class="chat-text" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem;">14 million</div>
            <div class="chat-meta" style="color: var(--accent);">On Meta</div>
            <p style="font-family: 'Inter', sans-serif; color: var(--text-muted); font-size: 1.2rem; margin-top: 1rem; line-height: 1.6;">Businesses already operate using Meta platforms.</p>
          </div>
          <div class="agent-card" style="border: none; padding: 0;">
            <div class="chat-text" style="font-size: 3rem; color: var(--text); margin-bottom: 1rem;">$22B</div>
            <div class="chat-meta">AI Impact</div>
            <p style="font-family: 'Inter', sans-serif; color: var(--text-muted); font-size: 1.2rem; margin-top: 1rem; line-height: 1.6;">AI could contribute $22 billion to Nigeria's GDP by 2035 under the right conditions.</p>
          </div>
        </div>
        <div style="position: absolute; bottom: 4rem; width: 100%; text-align: left;">
            <p style="font-family: 'Inter', sans-serif; font-size: 1.6rem; color: var(--text);">Businesses are already digital. <span style="color: var(--text-muted);">AI is the next layer.</span></p>
        </div>
      </main>
    </section>

    <!-- SLIDE 4: Solution -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Meet Morlen</div>
      </header>
      <main class="layout-center" style="padding-top: 4rem;">
        <div class="flow-diagram anim-seq" style="padding-top: 2rem; width: 100%; justify-content: space-between;">
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title">Inputs</div>
            <div class="flow-desc" style="white-space: pre-line;">Reviews
WhatsApp
Instagram
Facebook
Sales
Business Notes</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--accent);">Morlen</div>
            <div class="flow-desc">Business Memory</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title">Analysis</div>
            <div class="flow-desc">Behavioral Intelligence</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title">Action</div>
            <div class="flow-desc">AI Decision Engine</div>
          </div>
          <div class="flow-step" style="flex: 1;">
            <div class="flow-title" style="color: var(--text);">Output</div>
            <div class="flow-desc">Recommendations</div>
          </div>
        </div>
        <div style="position: absolute; bottom: 4rem; width: 100%; text-align: center;">
            <p style="font-family: 'Inter', sans-serif; font-size: 1.8rem; color: var(--text-muted);">Morlen learns how a business behaves over time.</p>
        </div>
      </main>
    </section>

    <!-- SLIDE 5: Product Demo -->
    <section class="slide">
      <main class="layout-center">
        <h1 class="headline" style="font-size: 8rem; letter-spacing: -0.04em; color: var(--text); opacity: 0.9;">Live Demo.</h1>
      </main>
    </section>

    <!-- SLIDE 6: Why Morlen? -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Competitive Advantage</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; text-align: left; padding-top: 2rem;">
        <h2 class="headline" style="font-size: 4rem; margin-bottom: 3rem;">Why Morlen Wins</h2>
        <div class="anim-seq" style="width: 100%;">
          <table style="width: 100%; text-align: left; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 1.3rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-highlight); color: var(--text);">
                <th style="padding: 1.5rem 1rem; font-weight: 600;">Traditional CRM</th>
                <th style="padding: 1.5rem 1rem; font-weight: 600;">ChatGPT</th>
                <th style="padding: 1.5rem 1rem; font-weight: 600; color: var(--accent);">Morlen</th>
              </tr>
            </thead>
            <tbody style="color: var(--text-muted);">
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1.5rem 1rem;">Stores customer data</td>
                <td style="padding: 1.5rem 1rem;">Generic answers</td>
                <td style="padding: 1.5rem 1rem; color: var(--text);">Learns each business</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1.5rem 1rem;">Reports history</td>
                <td style="padding: 1.5rem 1rem;">No business memory</td>
                <td style="padding: 1.5rem 1rem; color: var(--text);">Continuous business memory</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1.5rem 1rem;">No decision engine</td>
                <td style="padding: 1.5rem 1rem;">Single response</td>
                <td style="padding: 1.5rem 1rem; color: var(--text);">Multi-agent reasoning</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1.5rem 1rem;">No behavioural learning</td>
                <td style="padding: 1.5rem 1rem;">Doesn't evolve with business</td>
                <td style="padding: 1.5rem 1rem; color: var(--text);">Gets smarter over time</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="position: absolute; bottom: 4rem; width: 100%; text-align: left;">
            <p style="font-family: 'Inter', sans-serif; font-size: 1.4rem; color: var(--text); font-weight: 600;">Competitive Advantage</p>
            <p style="font-family: 'Inter', sans-serif; font-size: 1.2rem; color: var(--text-muted); margin-top: 0.5rem;">Business Memory • Multi-agent reasoning • Behaviour-first intelligence • Designed for real business workflows</p>
        </div>
      </main>
    </section>

    <!-- SLIDE 7: Business Model -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Business Model</div>
      </header>
      <main class="layout-asymmetric" style="gap: 6rem; padding-top: 2rem;">
        <div>
          <h2 class="headline" style="font-size: 4rem; line-height: 1.1;">How does Morlen<br/><em>make money?</em></h2>
          <div class="flow-diagram anim-seq" style="flex-direction: column; gap: 1.5rem; align-items: flex-start; padding-top: 3rem;">
             <div class="flow-step" style="width: 100%; text-align: left; padding: 1rem 2rem;"><div class="flow-title">Businesses</div></div>
             <div style="font-size: 1.5rem; color: var(--border-highlight); margin-left: 2rem;">↓</div>
             <div class="flow-step" style="width: 100%; text-align: left; padding: 1rem 2rem; border-color: rgba(226, 121, 83, 0.4);"><div class="flow-title" style="color: var(--accent);">Monthly SaaS</div></div>
             <div style="font-size: 1.5rem; color: var(--border-highlight); margin-left: 2rem;">↓</div>
             <div class="flow-step" style="width: 100%; text-align: left; padding: 1rem 2rem;"><div class="flow-title">Enterprise Licensing</div></div>
             <div style="font-size: 1.5rem; color: var(--border-highlight); margin-left: 2rem;">↓</div>
             <div class="flow-step" style="width: 100%; text-align: left; padding: 1rem 2rem;"><div class="flow-title">API Integrations</div></div>
             <div style="font-size: 1.5rem; color: var(--border-highlight); margin-left: 2rem;">↓</div>
             <div class="flow-step" style="width: 100%; text-align: left; padding: 1rem 2rem;"><div class="flow-title">Industry Intelligence (Future)</div></div>
          </div>
        </div>
        <div class="anim-seq" style="padding-top: 6rem;">
          <div style="border-bottom: 1px solid var(--border); padding: 2rem 0;">
             <div class="chat-meta" style="color: var(--accent); margin-bottom: 0.5rem;">Current</div>
             <div class="chat-text" style="font-size: 2rem;">Monthly subscriptions</div>
          </div>
          <div style="padding: 2rem 0;">
             <div class="chat-meta" style="margin-bottom: 0.5rem;">Future</div>
             <div class="chat-text" style="font-size: 2rem;">Enterprise deployments</div>
             <div class="chat-text" style="font-size: 2rem; margin-top: 1rem;">API</div>
             <div class="chat-text" style="font-size: 2rem; margin-top: 1rem;">Partner integrations</div>
          </div>
        </div>
      </main>
    </section>

    <!-- SLIDE 8: Traction -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Traction</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; text-align: left; padding-top: 2rem;">
        <h2 class="headline" style="font-size: 4.5rem; margin-bottom: 4rem;">Progress So Far</h2>
        <div class="anim-seq" style="width: 100%;">
            <ul style="font-family: 'Inter', sans-serif; font-size: 1.6rem; list-style: none; padding: 0; line-height: 3; color: var(--text);">
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

    <!-- SLIDE 9: Financial Projection -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Financial Projection</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; text-align: left; padding-top: 2rem;">
        <h2 class="headline" style="font-size: 4rem; margin-bottom: 3rem;">Subscription Projections</h2>
        <div class="anim-seq" style="width: 100%;">
          <table style="width: 100%; text-align: left; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 1.5rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-highlight); color: var(--text);">
                <th style="padding: 1.5rem 1rem; font-weight: 600;">Year</th>
                <th style="padding: 1.5rem 1rem; font-weight: 600;">Customers</th>
                <th style="padding: 1.5rem 1rem; font-weight: 600;">Monthly Fee</th>
                <th style="padding: 1.5rem 1rem; font-weight: 600; color: var(--accent);">ARR</th>
              </tr>
            </thead>
            <tbody style="color: var(--text-muted);">
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1.5rem 1rem;">1</td>
                <td style="padding: 1.5rem 1rem;">100</td>
                <td style="padding: 1.5rem 1rem;">₦10,000</td>
                <td style="padding: 1.5rem 1rem; color: var(--text);">₦12M</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1.5rem 1rem;">2</td>
                <td style="padding: 1.5rem 1rem;">500</td>
                <td style="padding: 1.5rem 1rem;">₦10,000</td>
                <td style="padding: 1.5rem 1rem; color: var(--accent);">₦60M</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1.5rem 1rem;">3</td>
                <td style="padding: 1.5rem 1rem;">2,000</td>
                <td style="padding: 1.5rem 1rem;">₦10,000</td>
                <td style="padding: 1.5rem 1rem; color: var(--text);">₦240M</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="position: absolute; bottom: 4rem; width: 100%; text-align: left;">
            <p style="font-family: 'Inter', sans-serif; font-size: 1.3rem; color: var(--text);">Conservative subscription-only scenario.</p>
            <p style="font-family: 'Inter', sans-serif; font-size: 1.1rem; color: var(--text-muted); margin-top: 0.5rem;">Enterprise licensing not included. These figures represent foundational assumptions.</p>
        </div>
      </main>
    </section>

    <!-- SLIDE 10: Roadmap -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Roadmap</div>
      </header>
      <main class="layout-center" style="align-items: flex-start; text-align: left; padding-top: 2rem;">
        <h2 class="headline" style="font-size: 4rem; margin-bottom: 4rem;">Timeline</h2>
        <div class="anim-seq" style="width: 100%;">
          <div style="display: flex; flex-direction: column; gap: 1rem; padding-left: 2rem; border-left: 2px solid var(--border-highlight); margin-left: 1rem; font-family: 'Inter', sans-serif; font-size: 1.4rem;">
             <div style="position: relative; margin-bottom: 1rem;">
                <span style="position: absolute; left: -2.4rem; top: 0.2rem; color: var(--accent);">•</span>
                <span style="font-weight: 600; color: var(--text);">2026</span>
             </div>
             
             <div style="color: var(--text-muted); margin-bottom: 0.5rem;">Customer Reviews</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">↓</div>
             
             <div style="color: var(--accent); margin-bottom: 0.5rem; font-weight: 500;">Business Memory</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">↓</div>
             
             <div style="color: var(--text-muted); margin-bottom: 0.5rem;">WhatsApp</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">↓</div>
             
             <div style="color: var(--text-muted); margin-bottom: 0.5rem;">Instagram</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">↓</div>
             
             <div style="color: var(--text-muted); margin-bottom: 0.5rem;">Facebook</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">↓</div>
             
             <div style="color: var(--text-muted); margin-bottom: 0.5rem;">Voice Notes</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">↓</div>
             
             <div style="color: var(--text-muted); margin-bottom: 0.5rem;">Inventory</div>
             <div style="color: var(--border-highlight); font-size: 1.2rem;">↓</div>
             
             <div style="color: var(--text-muted);">Enterprise Intelligence</div>
          </div>
        </div>
      </main>
    </section>

    <!-- SLIDE 11: Investment Opportunity -->
    <section class="slide">
      <header>
         <div class="slide-kicker">Use of Funds</div>
      </header>
      <main class="layout-asymmetric" style="gap: 8rem; padding-top: 4rem;">
        <div>
           <h3 class="headline" style="font-size: 4.5rem; margin-bottom: 2rem; line-height: 1.1;">Investment accelerates.</h3>
           <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border);">
             <div class="chat-meta" style="margin-bottom: 1rem;">Investment enables</div>
             <ul style="font-family: 'Inter', sans-serif; font-size: 1.2rem; list-style: none; padding: 0; line-height: 2; color: var(--text-muted);">
               <li>• WhatsApp integration</li>
               <li>• Facebook integration</li>
               <li>• Instagram integration</li>
               <li>• Mobile application</li>
               <li>• Customer pilots</li>
             </ul>
           </div>
        </div>
        <div class="anim-seq">
          <div style="margin-bottom: 3rem;">
            <div class="chat-meta" style="color: var(--accent); font-size: 1.5rem; margin-bottom: 0.5rem;">40%</div>
            <div class="chat-text" style="font-size: 1.8rem;">Engineering</div>
            <div style="font-family: 'Inter', sans-serif; color: var(--text-muted); font-size: 1rem; margin-top: 0.5rem;">Meta integrations</div>
          </div>
          <div style="margin-bottom: 3rem;">
            <div class="chat-meta" style="font-size: 1.5rem; margin-bottom: 0.5rem;">30%</div>
            <div class="chat-text" style="font-size: 1.8rem;">AI Infrastructure</div>
          </div>
          <div style="margin-bottom: 3rem;">
            <div class="chat-meta" style="font-size: 1.5rem; margin-bottom: 0.5rem;">20%</div>
            <div class="chat-text" style="font-size: 1.8rem;">Pilot Customers</div>
          </div>
          <div>
            <div class="chat-meta" style="font-size: 1.5rem; margin-bottom: 0.5rem;">10%</div>
            <div class="chat-text" style="font-size: 1.8rem;">Operations</div>
          </div>
        </div>
      </main>
    </section>

    <!-- SLIDE 12: Vision -->
    <section class="slide" style="background: var(--bg-solid);">
      <main class="layout-center" style="text-align: center;">
        <h2 class="headline" style="font-size: 5rem; max-width: 1200px; margin-bottom: 3rem; line-height: 1.2;">Businesses already generate intelligence.</h2>
        <h2 class="headline" style="font-size: 5rem; max-width: 1200px; color: var(--text-muted);">Morlen helps them use it.</h2>
        <div style="margin-top: 6rem; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 2rem; text-transform: uppercase; letter-spacing: 0.4em; color: var(--text); opacity: 0.9;">Morlen</div>
      </main>
    </section>"""

with open('/Users/ikhaisoshuare/Cascade/presentation.html', 'r') as f:
    content = f.read()

start_idx = content.find('<!-- SLIDE 1:')
end_idx = content.find('  </div>\n\n  <script>')

new_content = content[:start_idx] + html_content + '\n' + content[end_idx:]

with open('/Users/ikhaisoshuare/Cascade/presentation.html', 'w') as f:
    f.write(new_content)
