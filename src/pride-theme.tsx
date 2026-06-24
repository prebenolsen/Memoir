/**
 * 🏳️‍🌈 PRIDE THEME — TEMPORARY (June 2026)
 * ------------------------------------------------------------------
 * A self-contained, over-the-top Pride theme. Everything lives in this
 * single file so it's trivial to remove once Pride month is over.
 *
 * To delete this theme completely:
 *   1. Delete this file (src/pride-theme.tsx).
 *   2. Remove the `<PrideOverlay />` line in src/App.tsx.
 *   3. Remove the `root.classList.toggle('pride', …)` line in
 *      src/context/SettingsProvider.tsx.
 *   4. Remove the `'pride'` entry from the Theme union in src/types/db.ts
 *      and the Pride option in src/features/profile/ProfileScreen.tsx.
 *
 * The theme is activated when Settings → Theme is set to "Pride", which
 * adds the `pride` class to <html> (see SettingsProvider.applyTheme).
 * ------------------------------------------------------------------
 */
import { useMemo } from 'react';
import { useSettings } from '@/context/SettingsProvider';

const PRIDE_CSS = `
/* === Rainbow palette overrides (scoped to html.pride) === */
html.pride {
  --bg: 250 245 255;        /* soft lavender white */
  --surface: 255 255 255;
  --surface-alt: 252 240 255;
  --border: 244 200 255;
  --primary: 233 30 99;     /* hot pink */
  --primary-fg: 255 255 255;
  --accent: 124 77 255;     /* electric violet */
  --accent-fg: 255 255 255;
  --text: 35 18 50;
  --text-muted: 138 110 160;
  --danger: 233 30 99;
}

/* Animated diagonal rainbow stripes behind everything. */
html.pride body {
  background:
    repeating-linear-gradient(
      45deg,
      rgba(228, 3, 3, 0.16) 0px,
      rgba(228, 3, 3, 0.16) 40px,
      rgba(255, 140, 0, 0.16) 40px,
      rgba(255, 140, 0, 0.16) 80px,
      rgba(255, 237, 0, 0.16) 80px,
      rgba(255, 237, 0, 0.16) 120px,
      rgba(0, 128, 38, 0.16) 120px,
      rgba(0, 128, 38, 0.16) 160px,
      rgba(0, 77, 255, 0.16) 160px,
      rgba(0, 77, 255, 0.16) 200px,
      rgba(117, 7, 135, 0.16) 200px,
      rgba(117, 7, 135, 0.16) 240px
    ),
    rgb(var(--bg));
  background-attachment: fixed;
  background-size: 339px 339px, cover;
  animation: pride-stripe-drift 8s linear infinite;
}

@keyframes pride-stripe-drift {
  from { background-position: 0 0, 0 0; }
  to   { background-position: 339px 0, 0 0; }
}

/* Give cards/surfaces a rainbow glow so the stripes feel everywhere. */
html.pride .shadow-soft {
  box-shadow:
    0 0 0 1.5px rgba(255, 255, 255, 0.6),
    0 2px 10px rgba(233, 30, 99, 0.18),
    0 8px 28px rgba(124, 77, 255, 0.18);
}

/* Rainbow gradient text for the big serif headings. */
html.pride h1,
html.pride h2 {
  background: linear-gradient(
    90deg,
    #e40303, #ff8c00, #ffed00, #008026, #004dff, #750787, #e40303
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: pride-text-shimmer 6s linear infinite;
}

@keyframes pride-text-shimmer {
  to { background-position: 200% center; }
}

/* === Floating decoration overlay === */
.pride-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  overflow: hidden;
}

.pride-float {
  position: absolute;
  bottom: -10vh;
  font-size: var(--pride-size, 2rem);
  opacity: 0;
  will-change: transform, opacity;
  animation: pride-rise var(--pride-dur, 14s) linear infinite;
  animation-delay: var(--pride-delay, 0s);
}

@keyframes pride-rise {
  0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 0.85; }
  50%  { transform: translateY(-60vh) translateX(var(--pride-drift, 4vw)) rotate(180deg); }
  90%  { opacity: 0.85; }
  100% { transform: translateY(-120vh) translateX(0) rotate(360deg); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  html.pride body,
  html.pride h1,
  html.pride h2,
  .pride-float {
    animation: none !important;
  }
}
`;

const EMOJIS = ['🦄', '🌈', '✨', '🏳️‍🌈', '💖', '🦄', '🌈', '⭐', '🩷', '💜'];

interface FloatItem {
  emoji: string;
  left: number;
  size: number;
  dur: number;
  delay: number;
  drift: number;
}

function buildFloats(count: number): FloatItem[] {
  return Array.from({ length: count }, (_, i) => ({
    emoji: EMOJIS[i % EMOJIS.length],
    left: Math.round((i / count) * 100 + (Math.random() * 8 - 4)),
    size: 1.4 + Math.random() * 2.4,
    dur: 12 + Math.random() * 12,
    delay: -Math.random() * 24,
    drift: Math.random() * 10 - 5,
  }));
}

/**
 * Renders the rainbow stripe styles + drifting unicorns/rainbows.
 * Renders nothing unless the Pride theme is active.
 */
export function PrideOverlay() {
  const { settings } = useSettings();
  const floats = useMemo(() => buildFloats(24), []);

  if (settings.theme !== 'pride') return null;

  return (
    <>
      <style>{PRIDE_CSS}</style>
      <div className="pride-overlay" aria-hidden="true">
        {floats.map((f, i) => (
          <span
            key={i}
            className="pride-float"
            style={
              {
                left: `${f.left}%`,
                '--pride-size': `${f.size}rem`,
                '--pride-dur': `${f.dur}s`,
                '--pride-delay': `${f.delay}s`,
                '--pride-drift': `${f.drift}vw`,
              } as React.CSSProperties
            }
          >
            {f.emoji}
          </span>
        ))}
      </div>
    </>
  );
}
