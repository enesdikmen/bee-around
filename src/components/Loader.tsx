/**
 * Walking Lynx loader.
 *
 * A chunky, bold-outlined cartoon lynx walks in place — legs cycling in a
 * diagonal gait, body bobbing, tail flicking — while the whole animal
 * treks across the frame, walks off the right edge and instantly
 * reappears on the left.  Endless trek = the loop.
 *
 * Pure SVG shapes + CSS keyframes drive the walk cycle; Framer Motion
 * handles the across-frame travel and the enter/exit fade.  Theme colours
 * (gold coat, coral nose, forest spot, ink outlines) come from CSS vars.
 */
import { motion } from 'framer-motion'

interface Props {
  size?: number
  label?: string
}

export default function Loader({ size = 60, label }: Props) {
  const trackWidth = size * 2

  return (
    <motion.div
      className="lynx-loader"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div
        className="lynx-loader__track"
        style={{ width: trackWidth, height: size }}
      >
        <motion.div
          className="lynx-loader__walker"
          animate={{ x: [-size * 0.85, trackWidth] }}
          transition={{ duration: 3.2, ease: 'linear', repeat: Infinity }}
        >
          <svg
            viewBox="0 0 120 110"
            width={size}
            height={size * (110 / 120)}
            className="lynx-loader__svg"
            aria-hidden="true"
          >
            <g
              className="lynx-bob"
              fill="none"
              stroke="rgb(var(--color-ink))"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* ── Tail (short bob, black tip) ──────────────── */}
              <path
                className="lynx-tail"
                d="M26 56 C12 52 8 38 16 28"
                stroke="rgb(var(--color-ink))"
                strokeWidth="9"
              />

              {/* ── Far legs (behind body, lighter) ──────────── */}
              <g className="lynx-leg lynx-leg--a lynx-leg--far">
                <rect x="47" y="66" width="7" height="28" rx="3.5"
                  fill="rgb(var(--color-gold) / 0.5)" strokeWidth="2.4" />
                <circle cx="50" cy="92" r="4.5"
                  fill="rgb(var(--color-ink) / 0.55)" stroke="none" />
              </g>
              <g className="lynx-leg lynx-leg--b lynx-leg--far">
                <rect x="90" y="66" width="7" height="28" rx="3.5"
                  fill="rgb(var(--color-gold) / 0.5)" strokeWidth="2.4" />
                <circle cx="93" cy="92" r="4.5"
                  fill="rgb(var(--color-ink) / 0.55)" stroke="none" />
              </g>

              {/* ── Body + powerful haunch ───────────────────── */}
              <circle cx="38" cy="56" r="22" fill="rgb(var(--color-gold))" />
              <ellipse cx="62" cy="54" rx="36" ry="22"
                fill="rgb(var(--color-gold))" />
              {/* belly highlight */}
              <path d="M34 70 Q62 82 92 66" stroke="none"
                fill="rgb(var(--color-paper) / 0.55)" />

              {/* spots */}
              <circle cx="52" cy="48" r="2.6"
                fill="rgb(var(--color-ink))" stroke="none" />
              <circle cx="66" cy="56" r="2.6"
                fill="rgb(var(--color-ink))" stroke="none" />
              <circle cx="44" cy="60" r="2.4"
                fill="rgb(var(--color-forest))" stroke="none" />
              <circle cx="74" cy="48" r="2.4"
                fill="rgb(var(--color-ink))" stroke="none" />

              {/* ── Head + tufted ears + face ────────────────── */}
              <g className="lynx-head">
                {/* ear tufts */}
                <path d="M86 24 L82 6" strokeWidth="3" />
                <path d="M108 22 L112 4" strokeWidth="3" />
                {/* ears */}
                <path d="M82 30 L84 12 L96 26 Z"
                  fill="rgb(var(--color-gold))" />
                <path d="M100 26 L112 10 L114 30 Z"
                  fill="rgb(var(--color-gold))" />
                {/* head */}
                <circle cx="96" cy="42" r="18"
                  fill="rgb(var(--color-gold))" />
                {/* cheek ruff */}
                <path d="M82 50 L86 56 L82 60" strokeWidth="2.6" />
                {/* eye */}
                <circle cx="100" cy="40" r="2.6"
                  fill="rgb(var(--color-ink))" stroke="none" />
                {/* nose (coral) */}
                <path d="M112 44 l5 -2 l-1 5 Z"
                  fill="rgb(var(--color-accent))"
                  stroke="rgb(var(--color-ink))" strokeWidth="2" />
              </g>

              {/* ── Near legs (front, full colour) ───────────── */}
              <g className="lynx-leg lynx-leg--a">
                <rect x="39" y="64" width="8" height="30" rx="4"
                  fill="rgb(var(--color-gold))" strokeWidth="3" />
                <circle cx="43" cy="94" r="5"
                  fill="rgb(var(--color-ink))" stroke="none" />
              </g>
              <g className="lynx-leg lynx-leg--b">
                <rect x="82" y="64" width="8" height="30" rx="4"
                  fill="rgb(var(--color-gold))" strokeWidth="3" />
                <circle cx="86" cy="94" r="5"
                  fill="rgb(var(--color-ink))" stroke="none" />
              </g>
            </g>

            {/* ── Ground line ──────────────────────────────── */}
            <line x1="6" y1="100" x2="114" y2="100"
              stroke="rgb(var(--color-ink))" strokeWidth="3"
              strokeLinecap="round" />
          </svg>
        </motion.div>
      </div>

      {label && <span className="lynx-loader__label">{label}</span>}
    </motion.div>
  )
}
