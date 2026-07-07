import { memo, useMemo } from 'react';
import { Target, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface GoalSpec {
  id: string;
  label: string;
  description: string;
  target: number;
  unit: string;
  /** Returns the current value from the latest analysis, or null if no data yet */
  getValue: (result: NonNullable<ReturnType<typeof useAppStore.getState>['analysisResult']>) => number;
  /** True = lower is better (e.g. density); false = higher is better */
  lowerIsBetter: boolean;
}

const GOALS: GoalSpec[] = [
  {
    id: 'density',
    label: 'Max Zone Density',
    description: 'All zones below safe threshold (G. Keith Still: <2.0 pax/m²)',
    target: 2.0,
    unit: 'pax/m²',
    getValue: (r) => r.average_density,
    lowerIsBetter: true,
  },
  {
    id: 'evacuation',
    label: 'Evacuation Time',
    description: 'SGSA Green Guide: full evacuation within 8 minutes',
    target: 8.0,
    unit: 'min',
    getValue: (r) => r.evacuation_time_minutes,
    lowerIsBetter: true,
  },
  {
    id: 'readiness',
    label: 'Readiness Score',
    description: 'Composite score of all four safety axes (target: A grade ≥90)',
    target: 90.0,
    unit: '/100',
    getValue: (r) => r.crowd_score,
    lowerIsBetter: false,
  },
];

function GoalRow({ spec, current }: { spec: GoalSpec; current: number | null }) {
  const met = current !== null
    ? spec.lowerIsBetter
      ? current <= spec.target
      : current >= spec.target
    : null;

  const progressPct = current !== null
    ? spec.lowerIsBetter
      ? Math.max(0, Math.min(100, ((spec.target - current) / spec.target) * 100 + 50))
      : Math.max(0, Math.min(100, (current / spec.target) * 100))
    : 0;

  return (
    <div className="space-y-1.5" role="listitem">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {met === null ? (
            <TrendingUp className="h-4 w-4 flex-shrink-0 text-text-primary/30" aria-hidden="true" />
          ) : met ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-crowd-safe" aria-hidden="true" />
          ) : (
            <XCircle className="h-4 w-4 flex-shrink-0 text-crowd-critical" aria-hidden="true" />
          )}
          <span className="truncate text-xs text-text-primary">{spec.label}</span>
        </div>
        <span
          className={`flex-shrink-0 text-xs font-semibold ${
            met === null
              ? 'text-text-primary/30'
              : met
              ? 'text-crowd-safe'
              : 'text-crowd-critical'
          }`}
          aria-label={
            current !== null
              ? `${current.toFixed(1)} ${spec.unit}, target ${spec.target} ${spec.unit}, ${met ? 'goal met' : 'goal not met'}`
              : 'No data yet'
          }
        >
          {current !== null ? `${current.toFixed(1)}${spec.unit}` : '—'}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-pill bg-gray-100"
        role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${spec.label} progress`}
      >
        <div
          className={`h-full rounded-pill transition-all duration-500 ${
            met === null
              ? 'bg-white/20'
              : met
              ? 'bg-crowd-safe'
              : 'bg-crowd-critical'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <p className="text-xs text-text-primary/30 leading-tight">{spec.description}</p>
    </div>
  );
}

export const GoalTracker = memo(function GoalTracker() {
  const analysisResult = useAppStore((s) => s.analysisResult);

  const metCount = useMemo(() => {
    if (!analysisResult) return 0;
    return GOALS.filter((g) => {
      const val = g.getValue(analysisResult);
      return g.lowerIsBetter ? val <= g.target : val >= g.target;
    }).length;
  }, [analysisResult]);

  return (
    <section
      aria-label="Safety goals tracker"
      className="card-surface space-y-4 p-4"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-pitch-blue" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-text-primary">Safety Goals</h3>
        </div>
        {analysisResult && (
          <span
            className="text-xs text-text-primary/50"
            aria-label={`${metCount} of ${GOALS.length} goals met`}
          >
            {metCount}/{GOALS.length} met
          </span>
        )}
      </header>

      <div className="space-y-4" role="list" aria-label="Goal list">
        {GOALS.map((g) => (
          <GoalRow
            key={g.id}
            spec={g}
            current={analysisResult ? g.getValue(analysisResult) : null}
          />
        ))}
      </div>

      {!analysisResult && (
        <p className="text-xs text-text-primary/30 text-center pt-1">
          Run an analysis to track goals.
        </p>
      )}
    </section>
  );
});
