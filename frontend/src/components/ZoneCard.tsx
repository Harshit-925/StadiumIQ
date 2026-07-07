/**
 * ZoneCard — Operator dashboard zone card with safety tier badge.
 *
 * Tier transitions use Framer Motion correctly:
 * - Badge container: animate({ backgroundColor, borderColor }) — 250ms color fade
 * - Badge label: AnimatePresence keyed on tier — 150ms in/out text swap
 *
 * Both transitions are gated by useReducedMotion() — instant under reduced-motion.
 * Props are driven by real ZoneAnalysis data from the store, not static values.
 */
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

type Tier = 'safe' | 'moderate' | 'warning' | 'critical';

interface ZoneCardProps {
  zoneId: number;
  density: number;
  tier: Tier;
  label?: string;
  /** For mobile-priority sort: Critical/Warning zones surface first */
  sortIndex?: number;
}

const TIER_CONFIG: Record<
  Tier,
  { label: string; bg: string; border: string; text: string; dot: string; barClass: string }
> = {
  safe: {
    label:    'Safe',
    bg:       'rgba(30, 158, 99, 0.08)',
    border:   'rgba(30, 158, 99, 0.25)',
    text:     '#1E9E63',
    dot:      '#1E9E63',
    barClass: 'progress-fill-safe',
  },
  moderate: {
    label:    'Moderate',
    bg:       'rgba(224, 164, 48, 0.08)',
    border:   'rgba(224, 164, 48, 0.25)',
    text:     '#E0A430',
    dot:      '#E0A430',
    barClass: 'progress-fill-moderate',
  },
  warning: {
    label:    'Warning',
    bg:       'rgba(224, 123, 48, 0.08)',
    border:   'rgba(224, 123, 48, 0.25)',
    text:     '#E07B30',
    dot:      '#E07B30',
    barClass: 'progress-fill-warning',
  },
  critical: {
    label:    'Critical',
    bg:       'rgba(214, 69, 69, 0.08)',
    border:   'rgba(214, 69, 69, 0.25)',
    text:     '#D64545',
    dot:      '#D64545',
    barClass: 'progress-fill-critical',
  },
};

/**
 * Density thresholds per G. Keith Still crowd science:
 * < 2.0  → safe, 2.0–3.5 → moderate, 3.5–4.5 → warning, ≥ 4.5 → critical
 * Max density on scale is 6.0 pax/m² for bar width calculation.
 */
const MAX_DENSITY_DISPLAY = 6.0;

export function ZoneCard({ zoneId, density, tier, label }: ZoneCardProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const config = TIER_CONFIG[tier];
  const barWidth = `${Math.min((density / MAX_DENSITY_DISPLAY) * 100, 100)}%`;

  const transitionDuration = shouldReduceMotion ? 0 : 0.25;
  const labelTransitionDuration = shouldReduceMotion ? 0 : 0.15;

  return (
    <article
      className="card-surface p-4 flex flex-col gap-3 min-w-0"
      aria-label={`Zone ${zoneId}: ${density.toFixed(2)} pax per square metre, ${config.label}`}
    >
      {/* Zone header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-label-md text-text-secondary uppercase tracking-wide">
            Zone {zoneId}
          </p>
          {label && (
            <p className="text-label-sm text-text-secondary truncate">{label}</p>
          )}
        </div>

        {/* Tier badge — color transitions via animate, label via AnimatePresence */}
        <motion.div
          animate={{
            backgroundColor: config.bg,
            borderColor:     config.border,
            color:           config.text,
          }}
          transition={{ duration: transitionDuration, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5"
          style={{ fontSize: '0.6875rem', fontWeight: 600, lineHeight: '1.25' }}
        >
          {/* Status dot */}
          <span
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: config.dot }}
            aria-hidden="true"
          />
          {/* Label text — AnimatePresence for smooth swap */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={tier}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 3 }}
              transition={{ duration: labelTransitionDuration, ease: 'easeOut' }}
            >
              {config.label}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Primary density readout — mono font, large */}
      <div className="flex items-baseline gap-1">
        <span className="font-data text-data-lg text-text-primary" aria-hidden="true">
          {density.toFixed(2)}
        </span>
        <span className="text-label-sm text-text-secondary">pax/m²</span>
      </div>

      {/* Density bar */}
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(density * 10)} aria-valuemin={0} aria-valuemax={60} aria-label={`Density: ${density.toFixed(2)} pax per square metre`}>
        <div className={config.barClass} style={{ width: barWidth }} />
      </div>
    </article>
  );
}

export default ZoneCard;
