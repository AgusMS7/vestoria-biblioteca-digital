export function TextureFilters() {
  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="wood-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015 0.15"
            numOctaves="6"
            seed="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="grayNoise"
          />
        </filter>

        <filter id="wood-grain-dark" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.18"
            numOctaves="5"
            seed="7"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="grayNoise"
          />
        </filter>

        <filter id="wood-grain-shelf" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.2"
            numOctaves="5"
            seed="12"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="grayNoise"
          />
        </filter>

        <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="4"
            seed="5"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="grayNoise"
          />
        </filter>

        <filter id="paper-tonal" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves="3"
            seed="9"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="grayNoise"
          />
        </filter>
      </defs>
    </svg>
  )
}
