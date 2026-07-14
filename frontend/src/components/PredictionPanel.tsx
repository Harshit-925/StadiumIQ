/**
 * PredictionPanel — Short-term crowd density and wait time forecasting.
 *
 * Calls POST /api/prediction/trend with historical density data and
 * displays the projected density and estimated gate wait time.
 * Clearly surfaced as a simple mathematical projection, not an ML model.
 */
import { useState } from 'react';
import { TrendingUp, Clock, RefreshCw, AlertTriangle, Info } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface PredictionResult {
  projected_density: number;
  estimated_wait_minutes: number;
  minutes_ahead: number;
  methodology_note: string;
}

function DensityBadge({ density }: { density: number }) {
  if (density < 2) return <span className="rounded-pill bg-crowd-safe/15 px-2 py-0.5 text-label-sm text-crowd-safe">Safe</span>;
  if (density < 3.5) return <span className="rounded-pill bg-crowd-moderate/15 px-2 py-0.5 text-label-sm text-crowd-moderate">Moderate</span>;
  if (density < 4.5) return <span className="rounded-pill bg-crowd-warning/15 px-2 py-0.5 text-label-sm text-crowd-warning">Warning</span>;
  return <span className="rounded-pill bg-crowd-critical/15 px-2 py-0.5 text-label-sm text-crowd-critical">Critical</span>;
}

export function PredictionPanel() {
  const [minutesAhead, setMinutesAhead] = useState(15);
  const [currentQueue, setCurrentQueue] = useState(0);
  const [arrivalRate, setArrivalRate] = useState(10);
  const [rawDensities, setRawDensities] = useState('1.2, 1.5, 1.8, 2.1');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePredict() {
    const historical_densities = rawDensities
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (historical_densities.length < 2) {
      setError('Enter at least 2 comma-separated density readings.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/prediction/trend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historical_densities,
          minutes_ahead: minutesAhead,
          current_queue: currentQueue,
          arrival_rate: arrivalRate,
        }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail ?? `Server error: ${response.status}`);
      }
      setResult(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prediction');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Crowd trend prediction" className="card-surface p-5 space-y-4">
      <h2 className="text-heading-sm text-text-primary flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-pitch-blue" aria-hidden="true" />
        Crowd Trend Forecast
      </h2>

      {/* Model note disclaimer */}
      <div className="flex items-start gap-2 rounded-lg bg-stadium-blue/5 border border-stadium-blue/20 p-3">
        <Info className="h-4 w-4 text-stadium-blue shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-label-sm text-text-secondary">
          Simple linear extrapolation — directional signal only, not a trained ML model.
          Best within 30 minutes.
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label htmlFor="density-history" className="text-label-sm text-text-secondary block mb-1">
            Historical Densities (pax/m², oldest first, comma-separated)
          </label>
          <input
            id="density-history"
            type="text"
            value={rawDensities}
            onChange={(e) => setRawDensities(e.target.value)}
            placeholder="e.g. 1.2, 1.5, 1.8, 2.1"
            className="w-full rounded-input border border-gray-200 bg-white px-3 py-1.5 text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-pitch-blue"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="minutes-ahead" className="text-label-sm text-text-secondary block mb-1">
              Minutes Ahead (1–120)
            </label>
            <input
              id="minutes-ahead"
              type="number"
              min={1}
              max={120}
              value={minutesAhead}
              onChange={(e) => setMinutesAhead(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
              className="w-full rounded-input border border-gray-200 bg-white px-3 py-1.5 text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-pitch-blue"
            />
          </div>
          <div>
            <label htmlFor="current-queue" className="text-label-sm text-text-secondary block mb-1">
              Gate Queue (persons)
            </label>
            <input
              id="current-queue"
              type="number"
              min={0}
              value={currentQueue}
              onChange={(e) => setCurrentQueue(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full rounded-input border border-gray-200 bg-white px-3 py-1.5 text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-pitch-blue"
            />
          </div>
          <div>
            <label htmlFor="arrival-rate" className="text-label-sm text-text-secondary block mb-1">
              Arrival Rate (persons/min)
            </label>
            <input
              id="arrival-rate"
              type="number"
              min={0.1}
              step={0.1}
              value={arrivalRate}
              onChange={(e) => setArrivalRate(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              className="w-full rounded-input border border-gray-200 bg-white px-3 py-1.5 text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-pitch-blue"
            />
          </div>
        </div>
      </div>

      <button
        id="run-prediction-btn"
        onClick={handlePredict}
        disabled={loading}
        className="flex items-center gap-2 rounded-input bg-pitch-blue px-5 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-pitch-blue-light disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-pitch-blue focus-visible:ring-offset-2"
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? 'Projecting…' : 'Project Trend'}
      </button>

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-crowd-critical/30 bg-crowd-critical/5 p-3">
          <AlertTriangle className="h-4 w-4 text-crowd-critical shrink-0" aria-hidden="true" />
          <p className="text-label-sm text-crowd-critical">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="grid gap-4 sm:grid-cols-2" aria-live="polite">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-1">
            <p className="text-label-sm text-text-secondary uppercase tracking-wide">
              Projected Density in {result.minutes_ahead} min
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-data text-data-2xl text-text-primary">
                {result.projected_density.toFixed(2)}
              </span>
              <span className="text-body-sm text-text-secondary">pax/m²</span>
            </div>
            <DensityBadge density={result.projected_density} />
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-1 flex flex-col justify-between">
            <div>
              <p className="text-label-sm text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Estimated Gate Wait
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-data text-data-2xl text-text-primary">
                  {result.estimated_wait_minutes}
                </span>
                <span className="text-body-sm text-text-secondary">
                  {result.estimated_wait_minutes === 1 ? 'minute' : 'minutes'}
                </span>
              </div>
              {currentQueue === 0 && (
                <p className="text-label-sm text-crowd-safe">No queue</p>
              )}
            </div>
            
            <p className="text-body-sm text-text-muted mt-2 italic flex items-start gap-1.5 bg-gray-100/50 p-2 rounded">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{result.methodology_note}</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default PredictionPanel;
