/**
 * SustainabilityTracker — Dedicated operator sustainability screen.
 *
 * Metrics:
 * - Waste Diversion Rate: recycling_rate vs. EPA 90% target
 * - Sustainability Score: sustainability_score vs. target 80/100
 * - Energy / Water: labeled as "Not tracked in this analysis" (honest)
 *
 * Honest progress bars: current vs. target, labeled in text.
 * Large mono numbers for current value, target, and delta.
 */
import { Leaf, Droplets, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const WASTE_TARGET_PCT = 90.0; // EPA 90% diversion target
const SCORE_TARGET    = 80.0;  // StadiumIQ internal target

interface MetricPanelProps {
  icon: LucideIcon;
  label: string;
  current: number | null;
  target: number;
  unit: string;
  description: string;
  isHigherBetter?: boolean;
}

function MetricPanel({
  icon: Icon,
  label,
  current,
  target,
  unit,
  description,
  isHigherBetter = true,
}: MetricPanelProps) {
  const hasCurrent = current !== null;
  const pct = hasCurrent ? Math.min((current! / target) * 100, 100) : 0;
  const delta = hasCurrent ? current! - target : null;
  const onTarget = delta !== null && (isHigherBetter ? delta >= 0 : delta <= 0);

  return (
    <div className="card-surface p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-pitch-blue" aria-hidden="true" />
        <h2 className="text-heading-sm text-text-primary">{label}</h2>
      </div>

      {hasCurrent ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-data text-data-2xl text-text-primary">
              {current!.toFixed(1)}
            </span>
            <span className="text-body-sm text-text-secondary">{unit}</span>
          </div>

          <div>
            <div className="mb-2 flex justify-between text-label-sm text-text-secondary">
              <span>Current</span>
              <span>Target: {target}{unit}</span>
            </div>
            <div className="progress-track">
              <div
                className={onTarget ? 'progress-fill-safe' : 'progress-fill-warning'}
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${current!.toFixed(1)}${unit} of ${target}${unit} target`}
              />
            </div>
          </div>

          {delta !== null && (
            <p
              className={`text-body-sm font-semibold ${
                onTarget ? 'text-crowd-safe' : 'text-crowd-warning'
              }`}
            >
              {onTarget
                ? `✓ ${Math.abs(delta).toFixed(1)}${unit} above target`
                : `✗ ${Math.abs(delta).toFixed(1)}${unit} below target`}
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <div className="progress-track mb-3">
            <div className="progress-fill-blue" style={{ width: '0%' }} />
          </div>
          <p className="text-body-sm text-text-secondary">
            Not tracked in current analysis.
          </p>
          <p className="mt-1 text-label-sm text-text-secondary">
            Run an analysis to see live data.
          </p>
        </div>
      )}

      <p className="text-label-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

export function SustainabilityTracker() {
  const analysisResult = useAppStore((s) => s.analysisResult);

  // Waste diversion: backend returns recycling_rate as 0–1 fraction
  const wastePct = analysisResult
    ? analysisResult.recycling_rate * 100
    : null;

  const sustainScore = analysisResult?.sustainability_score ?? null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-heading-xl text-text-primary flex items-center gap-2">
          <Leaf className="h-6 w-6 text-stadium-green" aria-hidden="true" />
          Sustainability Tracker
        </h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Environmental performance metrics for FIFA World Cup 2026™ Green Goals compliance.
          Run an analysis to populate live data for the selected venue.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricPanel
          icon={Leaf}
          label="Waste Diversion Rate"
          current={wastePct}
          target={WASTE_TARGET_PCT}
          unit="%"
          description="EPA 90% diversion target. Measures the percentage of total waste successfully recycled or composted vs. landfilled."
        />

        <MetricPanel
          icon={Zap}
          label="Sustainability Score"
          current={sustainScore}
          target={SCORE_TARGET}
          unit="/100"
          description="Composite StadiumIQ sustainability index, scaled from waste diversion rate relative to the 90% EPA benchmark."
        />

        <MetricPanel
          icon={Droplets}
          label="Water Usage"
          current={null}
          target={100}
          unit="%"
          description="Water consumption vs. baseline. Not included in the current analysis model — reserved for future venue sensor integration."
        />
      </div>

      <div className="card-surface p-4">
        <p className="text-label-md text-text-secondary">
          <strong className="text-text-primary">Data sources:</strong> Waste diversion from
          analysis inputs (waste_recycled_kg / waste_total_kg). Score scaled against EPA 90%
          diversion target. Energy and water metrics require venue sensor integration.
        </p>
      </div>
    </div>
  );
}

export default SustainabilityTracker;
