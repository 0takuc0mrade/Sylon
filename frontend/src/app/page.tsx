export default function Dashboard() {
  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Business Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back. Here is the current pulse of your customers.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Review Volume</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>142</div>
          <p style={{ color: 'var(--text-secondary)' }}>Total grounded reviews ingested</p>
        </div>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Customer Archetypes</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>4</div>
          <p style={{ color: 'var(--text-secondary)' }}>Active personas identified</p>
        </div>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Top Dealbreaker</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '1rem' }}>{`"Wait Times"`}</div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Mentioned in 18% of recent negative reviews</p>
        </div>
      </div>

      <div className="glass-card">
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Strategy Collisions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <strong>Scenario:</strong> {`"What if we add outdoor seating?"`}
            <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{`Result: Positive alignment with "Experience Seekers", neutral for others.`}</div>
          </div>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <strong>Scenario:</strong> {`"Should I raise prices by 15%?"`}
            <div style={{ color: '#ef4444', marginTop: '0.5rem' }}>{`Result: High risk of alienating the "Bargain Hunter" segment (40% of base).`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
