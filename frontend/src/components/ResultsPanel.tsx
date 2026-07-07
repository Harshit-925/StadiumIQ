import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Shield,
  Clock,
  Accessibility,
  Leaf,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';

function GradeDisplay({ grade }: { grade: string }) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  const getGradeColor = (g: string): string => {
    if (g.startsWith('A')) return 'from-crowd-safe to-crowd-safe/60';
    if (g.startsWith('B')) return 'from-stadium-blue to-stadium-blue/60';
    if (g.startsWith('C')) return 'from-crowd-moderate to-crowd-moderate/60';
    if (g.startsWith('D')) return 'from-crowd-warning to-crowd-warning/60';
    return 'from-crowd-critical to-crowd-critical/60';
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 200, damping: 15 }
      }
      className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${getGradeColor(grade)}`}
    >
      <span className="text-3xl font-bold text-white">{grade}</span>
    </motion.div>
  );
}

function SkeletonLoader() {
  return (
    <div className="glass-surface animate-pulse p-6" role="status" aria-label="Loading results">
      <div className="mb-4 flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-3 w-48 rounded bg-white/10" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-1/2 rounded bg-white/10" />
      </div>
      <span className="visually-hidden">Loading analysis results…</span>
    </div>
  );
}

function ZoneDensityBar({
  zoneId,
  density,
  classification,
}: {
  zoneId: number;
  density: number;
  classification: string;
}) {
  const getBarColor = (d: number): string => {
    if (d < 2) return 'bg-crowd-safe';
    if (d < 3.5) return 'bg-crowd-moderate';
    if (d < 4.5) return 'bg-crowd-warning';
    return 'bg-crowd-critical';
  };

  const widthPercent = Math.min((density / 10) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs text-white/60">Zone {zoneId}</span>
      <div className="flex-1">
        <div className="h-2.5 w-full overflow-hidden rounded-pill bg-white/10">
          <div
            className={`h-full rounded-pill transition-all ${getBarColor(density)}`}
            style={{ width: `${widthPercent}%` }}
          />
        </div>
      </div>
      <span className="w-24 text-right text-xs text-white/60">
        {density.toFixed(1)} pax/m² · {classification}
      </span>
    </div>
  );
}

export function ResultsPanel() {
  const analysisResult = useAppStore((s) => s.analysisResult);
  const isLoading = useAppStore((s) => s.isLoading);
  const error = useAppStore((s) => s.error);

  useEffect(() => {
    if (analysisResult?.ai_fallback) {
      toast.warning(
        'AI insights are unavailable. Showing rule-based analysis.',
      );
    }
  }, [analysisResult?.ai_fallback]);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="glass-surface border-crowd-critical/30 p-6"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-crowd-critical" aria-hidden="true" />
          <p className="text-sm text-crowd-critical">{error}</p>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="glass-surface p-6 text-center">
        <Shield className="mx-auto mb-3 h-12 w-12 text-white/20" aria-hidden="true" />
        <p className="text-white/50">
          Select a venue and run an analysis to see results.
        </p>
      </div>
    );
  }

  const result = analysisResult;

  return (
    <div aria-live="polite" className="glass-surface space-y-6 p-6">
      {/* Header: Grade + Score */}
      <div className="flex items-center gap-4">
        <GradeDisplay grade={result.overall_grade} />
        <div>
          <h3 className="text-lg font-semibold text-white">
            {result.venue} Analysis
          </h3>
          <p className="text-sm text-white/60">
            Score: {result.crowd_score.toFixed(1)} / 100 · Avg Density:{' '}
            {result.average_density.toFixed(2)} pax/m²
          </p>
          <p className="text-xs text-white/40">
            {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Zone Density Breakdown */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
          <Shield className="h-4 w-4 text-stadium-blue" aria-hidden="true" />
          Zone Density Breakdown
        </h3>
        <div className="space-y-2">
          {result.zone_analyses.map((zone) => (
            <ZoneDensityBar
              key={zone.zone_id}
              zoneId={zone.zone_id}
              density={zone.density}
              classification={zone.classification.level}
            />
          ))}
        </div>
      </div>

      {/* Evacuation Assessment */}
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-4 w-4 text-stadium-blue" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-medium text-white/80">
            Evacuation Assessment
          </h3>
          <p className="text-sm text-white/60">
            Estimated time: {result.evacuation_time_minutes.toFixed(1)} minutes
            {' · '}
            <span
              className={
                result.evacuation_feasible
                  ? 'text-crowd-safe'
                  : 'text-crowd-critical'
              }
            >
              {result.evacuation_feasible
                ? '✓ Within safe limits'
                : '✗ Exceeds safe limits'}
            </span>
          </p>
        </div>
      </div>

      {/* Accessibility Compliance */}
      <div className="flex items-start gap-3">
        <Accessibility
          className="mt-0.5 h-4 w-4 text-stadium-blue"
          aria-hidden="true"
        />
        <div>
          <h3 className="text-sm font-medium text-white/80">
            Accessibility Compliance
          </h3>
          <p className="text-sm text-white/60">
            Wheelchair ratio: {(result.wheelchair_ratio * 100).toFixed(2)}%
            {' · '}
            <span
              className={
                result.accessibility_compliance
                  ? 'text-crowd-safe'
                  : 'text-crowd-warning'
              }
            >
              {result.accessibility_compliance
                ? '✓ ADA compliant'
                : '✗ Below ADA threshold'}
            </span>
          </p>
        </div>
      </div>

      {/* Sustainability Metrics */}
      <div className="flex items-start gap-3">
        <Leaf className="mt-0.5 h-4 w-4 text-crowd-safe" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-medium text-white/80">
            Sustainability Metrics
          </h3>
          <p className="text-sm text-white/60">
            Recycling rate: {(result.recycling_rate * 100).toFixed(1)}% ·
            Sustainability score: {result.sustainability_score.toFixed(1)}/100
          </p>
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-input border border-white/5 bg-white/[0.02] p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
          <Sparkles className="h-4 w-4 text-fifa-gold" aria-hidden="true" />
          AI Insights
          {result.ai_fallback && (
            <span className="rounded-pill bg-crowd-warning/20 px-2 py-0.5 text-xs text-crowd-warning">
              Rule-based fallback
            </span>
          )}
        </h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/60">
          {result.ai_insights}
        </p>
      </div>
    </div>
  );
}
