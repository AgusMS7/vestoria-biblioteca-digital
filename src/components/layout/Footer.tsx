export function Footer() {
  return (
    <footer className="wood-dark relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2 flex items-center justify-center gap-3">
          <span className="wood-engraved text-[11px]">VESTORIA</span>
          <span style={{ color: 'hsl(35 30% 60%)' }}>·</span>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '11px',
              color: 'hsl(35 30% 60%)',
            }}
          >
            Agustín Sandoval
          </span>
        </div>

        <div
          className="pb-3 text-center"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '.18em',
            color: 'hsl(35 20% 60%)',
          }}
        >
          CÓDIGO BAJO LICENCIA MIT · © 2026
        </div>
      </div>
    </footer>
  )
}
