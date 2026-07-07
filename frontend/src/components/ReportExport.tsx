import { memo, useState, useCallback } from 'react';
import { Download, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';

/** Build a plain-text report from the analysis result. */
function buildReport(result: NonNullable<ReturnType<typeof useAppStore.getState>['analysisResult']>): string {
  const now = new Date().toISOString();
  const lines: string[] = [
    '=== StadiumIQ — FIFA World Cup 2026 Operations Report ===',
    `Generated: ${now}`,
    `Venue: ${result.venue}`,
    `Analysis timestamp: ${result.timestamp}`,
    '',
    '--- Readiness Grade ---',
    `Overall grade: ${result.overall_grade}`,
    `Score: ${result.crowd_score.toFixed(1)} / 100`,
    '',
    '--- Crowd Density ---',
    `Average density: ${result.average_density.toFixed(2)} pax/m²`,
    '',
    '--- Zone Breakdown ---',
    ...result.zone_analyses.map(
      (z) => `  Zone ${z.zone_id}: ${z.density.toFixed(2)} pax/m²  [${z.classification.level.toUpperCase()}]`,
    ),
    '',
    '--- Evacuation Assessment ---',
    `Estimated time: ${result.evacuation_time_minutes.toFixed(1)} minutes`,
    `Status: ${result.evacuation_feasible ? 'WITHIN safe limits (≤8 min)' : 'EXCEEDS safe limits'}`,
    '',
    '--- Accessibility Compliance ---',
    `Wheelchair seating ratio: ${(result.wheelchair_ratio * 100).toFixed(2)}%`,
    `ADA compliant: ${result.accessibility_compliance ? 'YES' : 'NO'}`,
    '',
    '--- Sustainability ---',
    `Recycling rate: ${(result.recycling_rate * 100).toFixed(1)}%`,
    `Sustainability score: ${result.sustainability_score.toFixed(1)} / 100`,
    '',
    '--- AI Insights ---',
    result.ai_insights,
    result.ai_fallback ? '(Note: AI unavailable — rule-based fallback used)' : '',
    '',
    '=== End of Report ===',
    'Sources: G. Keith Still crowd science, SGSA Green Guide, ADA Standards, EPA SMM',
  ];
  return lines.filter((l) => l !== undefined).join('\n');
}

/** Trigger a browser file download from a string. */
function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ReportExport = memo(function ReportExport() {
  const result = useAppStore((s) => s.analysisResult);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = useCallback(async () => {
    if (!result || isExporting) return;
    setIsExporting(true);
    try {
      // Small artificial delay for UX clarity
      await new Promise((r) => setTimeout(r, 400));
      const report = buildReport(result);
      const venueName = result.venue.replace(/\s+/g, '_').toLowerCase();
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
      downloadText(report, `stadiumiq_${venueName}_${timestamp}.txt`);
      setExported(true);
      toast.success('Report downloaded successfully');
      setTimeout(() => setExported(false), 3000);
    } catch {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  }, [result, isExporting]);

  return (
    <section aria-label="Export report" className="card-surface space-y-4 p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-pitch-blue" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-text-primary">Export Report</h3>
      </div>

      <p className="text-xs text-text-primary/50 leading-relaxed">
        Download a plain-text operations report including crowd metrics, evacuation
        assessment, accessibility compliance, and AI insights.
      </p>

      <button
        id="export-report-btn"
        onClick={() => void handleExport()}
        disabled={!result || isExporting}
        aria-disabled={!result || isExporting}
        aria-label={
          !result
            ? 'Export report — run an analysis first'
            : isExporting
            ? 'Exporting report…'
            : exported
            ? 'Report exported'
            : 'Export operations report as text file'
        }
        className="flex w-full items-center justify-center gap-2 rounded-input border border-gray-200 py-2.5 text-sm text-text-secondary transition-all hover:border-stadium-blue hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stadium-blue"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Exporting…</span>
          </>
        ) : exported ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-crowd-safe" aria-hidden="true" />
            <span className="text-crowd-safe">Exported!</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Download Report (.txt)</span>
          </>
        )}
      </button>

      {!result && (
        <p className="text-center text-xs text-text-primary/30">
          Run an analysis first to enable export.
        </p>
      )}
    </section>
  );
});
