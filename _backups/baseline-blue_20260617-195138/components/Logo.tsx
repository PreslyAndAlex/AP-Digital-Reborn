import './Logo.css'

type LogoProps = {
  /** "plate" draws the rounded background tile; "transparent" omits it. */
  variant?: 'plate' | 'transparent'
  /** Rough pixel size of the lockup (height of the plate, or scale anchor). */
  size?: number
  className?: string
}

/**
 * The A&P Digital lockup, rebuilt in SVG: a serif "A&P", a gradient divider
 * rule, and letter-spaced "DIGITAL" beneath it. Mirrors the supplied artwork
 * without needing an image file.
 */
export default function Logo({ variant = 'transparent', size = 96, className }: LogoProps) {
  const showPlate = variant === 'plate'

  return (
    <svg
      className={`logo ${className ?? ''}`}
      width={size}
      height={size}
      viewBox="0 0 320 320"
      role="img"
      aria-label="A&P Digital"
    >
      <defs>
        <linearGradient id="logoPlate" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a2363" />
          <stop offset="1" stopColor="#0d1230" />
        </linearGradient>
        <linearGradient id="logoRule" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent, #4f8bff)" />
          <stop offset="1" stopColor="var(--accent-2, #38d6e6)" />
        </linearGradient>
      </defs>

      {showPlate && <rect width="320" height="320" rx="64" fill="url(#logoPlate)" />}

      <text
        x="160"
        y="178"
        textAnchor="middle"
        className="logo-mark"
        fill="var(--on-dark, #f5f5f7)"
      >
        A&amp;P
      </text>

      <rect x="96" y="206" width="128" height="5" rx="2.5" fill="url(#logoRule)" />

      <text
        x="160"
        y="250"
        textAnchor="middle"
        className="logo-word"
        fill="var(--on-dark, #f5f5f7)"
      >
        DIGITAL
      </text>
    </svg>
  )
}
