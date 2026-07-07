import { motion, useReducedMotion } from 'framer-motion';

interface CrowdDensityGaugeProps {
  density: number;
}

function getClassification(density: number): {
  label: string;
  color: string;
  textColor: string;
} {
  if (density < 2) {
    return { label: 'Safe', color: '#10B981', textColor: 'text-crowd-safe' };
  }
  if (density < 3.5) {
    return {
      label: 'Moderate',
      color: '#F59E0B',
      textColor: 'text-crowd-moderate',
    };
  }
  if (density < 4.5) {
    return {
      label: 'Warning',
      color: '#F97316',
      textColor: 'text-crowd-warning',
    };
  }
  return {
    label: 'Critical',
    color: '#EF4444',
    textColor: 'text-crowd-critical',
  };
}

export function CrowdDensityGauge({ density }: CrowdDensityGaugeProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const classification = getClassification(density);

  // Clamp density to 0-10 for gauge display
  const clampedDensity = Math.min(Math.max(density, 0), 10);
  // Convert density to angle: 0 maps to -90deg (left), 10 maps to 90deg (right)
  const needleAngle = (clampedDensity / 10) * 180 - 90;

  const ariaLabel = `Crowd density gauge showing ${density.toFixed(2)} people per square meter, classified as ${classification.label}`;

  return (
    <div
      className="glass-surface p-6"
      role="img"
      aria-label={ariaLabel}
    >
      <h3 className="mb-4 text-center text-sm font-medium text-white/80">
        Average Crowd Density
      </h3>

      <div className="relative mx-auto" style={{ width: 240, height: 140 }}>
        {/* Gauge Arc - SVG semicircle */}
        <svg
          viewBox="0 0 240 130"
          className="w-full"
          aria-hidden="true"
        >
          {/* Background arc */}
          <path
            d="M 20 120 A 100 100 0 0 1 220 120"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Green zone (0-2): 0° to 36° of 180° */}
          <path
            d="M 20 120 A 100 100 0 0 1 42.68 52.68"
            fill="none"
            stroke="#10B981"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Yellow zone (2-3.5): 36° to 63° */}
          <path
            d="M 42.68 52.68 A 100 100 0 0 1 86.82 23.5"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="16"
            opacity="0.6"
          />

          {/* Orange zone (3.5-4.5): 63° to 81° */}
          <path
            d="M 86.82 23.5 A 100 100 0 0 1 120 20"
            fill="none"
            stroke="#F97316"
            strokeWidth="16"
            opacity="0.6"
          />

          {/* Red zone (4.5-10): 81° to 180° */}
          <path
            d="M 120 20 A 100 100 0 0 1 220 120"
            fill="none"
            stroke="#EF4444"
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Needle */}
          <motion.line
            x1="120"
            y1="120"
            x2="120"
            y2="35"
            stroke={classification.color}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transformOrigin: '120px 120px' }}
            initial={
              shouldReduceMotion
                ? { rotate: needleAngle }
                : { rotate: -90 }
            }
            animate={{ rotate: needleAngle }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 60, damping: 15 }
            }
          />

          {/* Center dot */}
          <circle
            cx="120"
            cy="120"
            r="6"
            fill={classification.color}
          />

          {/* Scale labels */}
          <text x="15" y="128" fill="rgba(255,255,255,0.4)" fontSize="10">
            0
          </text>
          <text x="115" y="15" fill="rgba(255,255,255,0.4)" fontSize="10">
            5
          </text>
          <text x="218" y="128" fill="rgba(255,255,255,0.4)" fontSize="10">
            10
          </text>
        </svg>
      </div>

      {/* Numerical display */}
      <div className="mt-2 text-center">
        <p className={`text-3xl font-bold ${classification.textColor}`}>
          {density.toFixed(2)}
        </p>
        <p className="text-sm text-white/50">pax/m²</p>
        <span
          className={`mt-2 inline-block rounded-pill px-3 py-1 text-xs font-medium ${classification.textColor}`}
          style={{
            backgroundColor: `${classification.color}20`,
          }}
        >
          {classification.label}
        </span>
      </div>
    </div>
  );
}
