import { memo, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

/** Hard-coded reference benchmarks derived from published FIFA/SGSA standards. */
const BENCHMARKS = [
  {
    id: 'density',
    label: 'Avg Crowd Density',
    unit: 'pax/m²',
    yourKey: 'average_density' as const,
    /** FIFA event-day benchmark: 1.5 pax/m² average across all zones */
    benchmark: 1.5,
    /** Lower is better for density */
    lowerIsBetter: true,
  },
  {
    id: 'accessibility',
    label: 'Wheelchair Ratio',
    unit: '%',
    yourKey: 'wheelchair_ratio' as const,
    /** ADA minimum: 1 % — FIFA aims for 1.5 % for new facilities */
    benchmark: 1.5,
    lowerIsBetter: false,
  },
  {
    id: 'sustainability',
    label: 'Recycling Rate',
    unit: '%',
    yourKey: 'recycling_rate' as const,
    /** EPA 90 % diversion target */
    benchmark: 90.0,
    lowerIsBetter: false,
  },
] as const;

type BenchmarkKey = (typeof BENCHMARKS)[number]['yourKey'];

function getDisplayValue(key: BenchmarkKey, value: number): string {
  if (key === 'wheelchair_ratio') return `${(value * 100).toFixed(2)}%`;
  if (key === 'recycling_rate') return `${(value * 100).toFixed(1)}%`;
  return `${value.toFixed(2)}`;
}

function BenchmarkRow({
  label,
  unit,
  yourValue,
  benchmark,
  lowerIsBetter,
  displayYours,
}: {
  label: string;
  unit: string;
  yourValue: number | null;
  benchmark: number;
  lowerIsBetter: boolean;
  displayYours: string;
}) {
  const benchmarkDisplay = `${benchmark}${unit === '%' ? '%' : ` ${unit}`}`;

  const better =
    yourValue !== null
      ? lowerIsBetter
        ? yourValue <= benchmark
        : yourValue >= benchmark
      : null;

  // Normalise both values to a 0–100 scale for the bars
  const maxVal = lowerIsBetter
    ? Math.max(benchmark * 2, yourValue ?? 0) || 1
    : Math.max(benchmark, yourValue ?? 0, 1);

  const benchmarkPct = Math.min(100, (benchmark / maxVal) * 100);
  const yourPct =
    yourValue !== null ? Math.min(100, (yourValue / maxVal) * 100) : 0;

  return (
    <div className="space-y-2" role="listitem">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <div className="flex items-center gap-3 text-right">
          <span className="text-text-secondary/70">
            <span className="text-text-primary/20">Target:</span> {benchmarkDisplay}
          </span>
          <span
            className={
              better === null
                ? 'text-text-primary/30'
                : better
                ? 'font-semibold text-crowd-safe'
                : 'font-semibold text-crowd-warning'
            }
            aria-label={
              yourValue !== null
                ? `${label}: ${displayYours}, ${better ? 'above' : 'below'} benchmark of ${benchmarkDisplay}`
                : `${label}: no data`
            }
          >
            {yourValue !== null ? displayYours : '—'}
          </span>
        </div>
      </div>

      {/* Stacked bar: benchmark (ghost) + yours */}
      <div className="relative h-2 overflow-hidden rounded-pill bg-gray-100" aria-hidden="true">
        {/* Benchmark marker */}
        <div
          className="absolute top-0 h-full rounded-pill bg-white/20"
          style={{ width: `${benchmarkPct}%` }}
        />
        {/* Your value bar */}
        {yourValue !== null && (
          <div
            className={`absolute top-0 h-full rounded-pill transition-all duration-500 ${
              better ? 'bg-crowd-safe' : 'bg-crowd-warning'
            }`}
            style={{ width: `${yourPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

export const ComparisonBar = memo(function ComparisonBar() {
  const result = useAppStore((s) => s.analysisResult);

  const rows = useMemo(
    () =>
      BENCHMARKS.map((b) => {
        const raw = result ? (result[b.yourKey] as number) : null;
        const display = raw !== null ? getDisplayValue(b.yourKey, raw) : '—';
        return { ...b, yourValue: raw, displayYours: display };
      }),
    [result],
  );

  return (
    <section aria-label="Benchmark comparison" className="card-surface space-y-4 p-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-pitch-blue" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-text-primary">vs. FIFA Benchmarks</h3>
      </div>

      <div className="space-y-4" role="list" aria-label="Benchmark rows">
        {rows.map((r) => (
          <BenchmarkRow
            key={r.id}
            label={r.label}
            unit={r.unit}
            yourValue={r.yourValue}
            benchmark={r.benchmark}
            lowerIsBetter={r.lowerIsBetter}
            displayYours={r.displayYours}
          />
        ))}
      </div>

      <p className="text-xs text-text-primary/30">
        Benchmarks: G. Keith Still crowd science, ADA Standards, EPA 90% diversion target.
      </p>

      {!result && (
        <p className="text-xs text-text-primary/30 text-center">
          Run an analysis to compare.
        </p>
      )}
    </section>
  );
});
