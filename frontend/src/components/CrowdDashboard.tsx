/**
 * CrowdDashboard — Primary operator screen.
 *
 * Light theme, data-dense but calm. Layout:
 * - Venue selector (top)
 * - 4-column metric row (Occupancy, Avg Density, Evacuation, Grade)
 * - ZoneCard grid over StadiumPulse STATIC backdrop (zero motion on data screen)
 * - AI Insights (aria-live="polite")
 * - GoalTracker + ComparisonBar (restyled)
 * - InputForm (run new analysis)
 */
import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { VenueSelector } from './VenueSelector';
import { InputForm } from './InputForm';
import { ResultsPanel } from './ResultsPanel';
import { CrowdDensityGauge } from './CrowdDensityGauge';
import { HistoryChart } from './HistoryChart';
import { GoalTracker } from './GoalTracker';
import { ComparisonBar } from './ComparisonBar';
import { ReportExport } from './ReportExport';
import { ZoneCard } from './ZoneCard';
import { StadiumPulse } from './StadiumPulse';
import type { ZoneAnalysis } from '../types';

type Tier = 'safe' | 'moderate' | 'warning' | 'critical';

// Severity order for mobile priority sort
const TIER_SEVERITY: Record<Tier, number> = {
  critical: 3,
  warning:  2,
  moderate: 1,
  safe:     0,
};

function MetricCard({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
}) {
  return (
    <div className="card-surface p-5 flex flex-col gap-2">
      <p className="text-label-md text-text-secondary uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-data text-data-2xl text-text-primary">{value}</span>
        {unit && <span className="text-body-sm text-text-secondary">{unit}</span>}
      </div>
      {sub && <p className="text-label-sm text-text-secondary">{sub}</p>}
    </div>
  );
}

export function CrowdDashboard() {
  const selectedVenue = useAppStore((s) => s.selectedVenue);
  const analysisResult = useAppStore((s) => s.analysisResult);

  // Determine worst tier for StadiumPulse static backdrop
  const worstTier = useMemo((): Tier => {
    if (!analysisResult) return 'safe';
    const levels = analysisResult.zone_analyses.map(
      (z: ZoneAnalysis) => z.classification.level as Tier,
    );
    return levels.reduce((worst, tier) =>
      TIER_SEVERITY[tier] > TIER_SEVERITY[worst] ? tier : worst,
    'safe' as Tier);
  }, [analysisResult]);

  // Mobile: sort zones worst first
  const sortedZones = useMemo(() => {
    if (!analysisResult) return [];
    return [...analysisResult.zone_analyses].sort(
      (a, b) =>
        TIER_SEVERITY[b.classification.level as Tier] -
        TIER_SEVERITY[a.classification.level as Tier],
    );
  }, [analysisResult]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="sr-only">Crowd Dashboard — {selectedVenue.name}</h1>

      {/* Venue Selector */}
      <section aria-label="Venue selection">
        <VenueSelector />
      </section>

      {/* Metric Row */}
      {analysisResult && (
        <section aria-label="Key metrics">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              label="Avg Density"
              value={analysisResult.average_density.toFixed(2)}
              unit="pax/m²"
              sub="G. Keith Still scale"
            />
            <MetricCard
              label="Crowd Score"
              value={analysisResult.crowd_score.toFixed(0)}
              unit="/ 100"
              sub={`Grade ${analysisResult.overall_grade}`}
            />
            <MetricCard
              label="Evacuation"
              value={analysisResult.evacuation_time_minutes.toFixed(1)}
              unit="min"
              sub={analysisResult.evacuation_feasible ? '✓ Within standard' : '✗ Exceeds standard'}
            />
            <MetricCard
              label="Zones"
              value={analysisResult.zone_analyses.length}
              sub={`${selectedVenue.name}`}
            />
          </div>
        </section>
      )}

      {/* Zone Grid with StadiumPulse static backdrop */}
      {analysisResult && (
        <section aria-label="Zone density breakdown">
          <h2 className="mb-4 text-heading-sm text-text-primary">Zone Density</h2>

          {/* Static backdrop — zero motion, just tinted by worst tier */}
          <div className="relative rounded-xl overflow-hidden">
            <StadiumPulse
              variant="static"
              worstTier={worstTier}
              className="absolute inset-0 rounded-xl"
            />
            <div className="relative grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {sortedZones.map((zone: ZoneAnalysis) => (
                <ZoneCard
                  key={zone.zone_id}
                  zoneId={zone.zone_id}
                  density={zone.density}
                  tier={zone.classification.level as Tier}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Insights */}
      {analysisResult?.ai_insights && (
        <section
          aria-label="AI operational insights"
          aria-live="polite"
          className="card-surface p-5"
        >
          <h2 className="mb-3 flex items-center gap-2 text-heading-sm text-text-primary">
            <Sparkles className="h-4 w-4 text-trophy-gold" aria-hidden="true" />
            AI Insights
            {analysisResult.ai_fallback && (
              <span className="rounded-pill bg-crowd-warning/10 px-2 py-0.5 text-label-sm text-crowd-warning">
                Rule-based fallback
              </span>
            )}
          </h2>
          <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-text-secondary">
            {analysisResult.ai_insights}
          </p>
        </section>
      )}

      {/* Two-column: Input Form + Results */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Analysis input">
          <InputForm />
        </section>
        <section aria-label="Analysis results">
          <div className="space-y-6">
            <ResultsPanel />
            {analysisResult && (
              <CrowdDensityGauge density={analysisResult.average_density} />
            )}
          </div>
        </section>
      </div>

      {/* History Chart */}
      <section aria-label="Analysis history">
        <h2 className="mb-4 text-heading-sm text-text-primary">Analysis History</h2>
        <HistoryChart />
      </section>

      {/* Goals + Benchmark + Export */}
      <div className="grid gap-6 md:grid-cols-3">
        <section aria-label="Safety goals">
          <GoalTracker />
        </section>
        <section aria-label="FIFA benchmark comparison">
          <ComparisonBar />
        </section>
        <section aria-label="Report export">
          <ReportExport />
        </section>
      </div>
    </div>
  );
}

export default CrowdDashboard;
