/**
 * StadiumPulse — 2D SVG/CSS ambient stadium bowl visualization.
 *
 * Two distinct contexts:
 * - Landing page (variant="animated"): concentric ellipses breathe with
 *   CSS keyframe animation, always using safe-tier pacing. Pure decoration.
 * - Operator dashboard (variant="static"): a flat tinted backdrop colored
 *   by the venue's overall worst tier. ZERO motion — data legibility first.
 *
 * In both cases: aria-hidden="true", not focusable, purely decorative.
 * Reduced-motion: all animation disabled; static fills only.
 */
import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

type Tier = 'safe' | 'moderate' | 'warning' | 'critical';

interface StadiumPulseProps {
  /** "animated" = landing page (always animates at safe pace).
   *  "static"   = operator dashboard (no animation, tinted backdrop only). */
  variant: 'animated' | 'static';
  /** Only used in "static" variant: colors the backdrop by the worst tier */
  worstTier?: Tier;
  className?: string;
}

/** Tier → color map for the static dashboard backdrop */
const STATIC_TIER_COLORS: Record<Tier, string> = {
  safe:     'rgba(30, 158, 99, 0.06)',
  moderate: 'rgba(224, 164, 48, 0.06)',
  warning:  'rgba(224, 123, 48, 0.06)',
  critical: 'rgba(214, 69, 69, 0.06)',
};

/** Ellipse rings for the animated landing page version */
const RINGS = [
  { rx: 48, ry: 38, opacity: 0.18, delay: 0,    tier: 'safe' as Tier },
  { rx: 36, ry: 28, opacity: 0.22, delay: 0.4,  tier: 'safe' as Tier },
  { rx: 24, ry: 18, opacity: 0.26, delay: 0.8,  tier: 'safe' as Tier },
  { rx: 14, ry: 10, opacity: 0.30, delay: 1.2,  tier: 'safe' as Tier },
];

const TIER_FILL: Record<Tier, string> = {
  safe:     '#1E9E63',
  moderate: '#E0A430',
  warning:  '#E07B30',
  critical: '#D64545',
};

export function StadiumPulse({ variant, worstTier = 'safe', className = '' }: StadiumPulseProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  const staticColor = useMemo(
    () => STATIC_TIER_COLORS[worstTier],
    [worstTier],
  );

  if (variant === 'static') {
    // Operator dashboard: zero motion, flat tinted backdrop
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none select-none ${className}`}
        style={{ backgroundColor: staticColor }}
      />
    );
  }

  // Landing page: animated concentric rings (respects reduced-motion)
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <svg
        viewBox="0 0 100 80"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        aria-hidden="true"
      >
        {RINGS.map((ring, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="40"
            rx={ring.rx}
            ry={ring.ry}
            fill={TIER_FILL[ring.tier]}
            opacity={ring.opacity}
            className={shouldReduceMotion ? '' : 'pulse-safe'}
            style={
              shouldReduceMotion
                ? {}
                : { animationDelay: `${ring.delay}s` }
            }
          />
        ))}
        {/* Pitch rectangle */}
        <rect
          x="34"
          y="31"
          width="32"
          height="18"
          rx="2"
          fill="#1E7A46"
          opacity="0.25"
        />
      </svg>
    </div>
  );
}

export default StadiumPulse;
