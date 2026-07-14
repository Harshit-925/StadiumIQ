/**
 * VolunteerPanel — Volunteer allocation and relocation management.
 *
 * Calls POST /api/volunteer/allocate with current zone data and
 * displays the computed staff assignments alongside any suggested
 * relocations from low-risk to high-risk zones.
 */
import { useState } from 'react';
import { Users, ArrowRight, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface Allocation {
  allocations: Record<string, number>;
  relocations: Array<{ from_zone: string; to_zone: string; count: number }>;
  total_allocated: number;
}

const RISK_COLORS: Record<string, string> = {
  CRITICAL: 'text-crowd-critical',
  WARNING: 'text-crowd-warning',
  MODERATE: 'text-crowd-moderate',
  SAFE: 'text-crowd-safe',
};

const RISK_BADGE: Record<string, string> = {
  CRITICAL: 'bg-crowd-critical/15 text-crowd-critical',
  WARNING: 'bg-crowd-warning/15 text-crowd-warning',
  MODERATE: 'bg-crowd-moderate/15 text-crowd-moderate',
  SAFE: 'bg-crowd-safe/15 text-crowd-safe',
};

const DEFAULT_ZONES = [
  { id: 'gate_a', name: 'Gate A', capacity: 2000, risk_level: 'SAFE' },
  { id: 'gate_b', name: 'Gate B', capacity: 2000, risk_level: 'SAFE' },
  { id: 'gate_c', name: 'Gate C', capacity: 2000, risk_level: 'SAFE' },
  { id: 'concourse_north', name: 'North Concourse', capacity: 5000, risk_level: 'SAFE' },
  { id: 'concourse_south', name: 'South Concourse', capacity: 5000, risk_level: 'SAFE' },
  { id: 'bowl_lower', name: 'Lower Bowl', capacity: 20000, risk_level: 'SAFE' },
  { id: 'bowl_upper', name: 'Upper Bowl', capacity: 15000, risk_level: 'SAFE' },
];

export function VolunteerPanel() {
  const [availableStaff, setAvailableStaff] = useState(50);
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [result, setResult] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRisk(id: string, risk_level: string) {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, risk_level } : z)));
  }

  async function handleAllocate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/volunteer/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zones: zones.map(({ id, capacity, risk_level }) => ({ id, capacity, risk_level })),
          available_staff: availableStaff,
        }),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      setResult(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch allocations');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-heading-md font-display text-text-primary flex items-center gap-2">
        <Users className="h-6 w-6 text-pitch-blue" aria-hidden="true" />
        Volunteer Management
      </h1>

      {/* Controls */}
      <section aria-label="Allocation inputs" className="card-surface p-5 space-y-4">
        <h2 className="text-heading-sm text-text-primary">Configure Allocation</h2>

        <div className="flex items-center gap-4">
          <label htmlFor="staff-count" className="text-body-sm text-text-secondary w-40 shrink-0">
            Available Staff
          </label>
          <input
            id="staff-count"
            type="number"
            min={1}
            max={10000}
            value={availableStaff}
            onChange={(e) => setAvailableStaff(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-28 rounded-input border border-gray-200 bg-white px-3 py-1.5 text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-pitch-blue"
          />
        </div>

        {/* Zone risk selectors */}
        <div className="space-y-2">
          <p className="text-label-sm text-text-secondary uppercase tracking-wide">Zone Risk Levels</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <span className="text-body-sm text-text-primary truncate mr-2" title={zone.name}>
                  {zone.name}
                </span>
                <select
                  aria-label={`Risk level for ${zone.name}`}
                  value={zone.risk_level}
                  onChange={(e) => updateRisk(zone.id, e.target.value)}
                  className={`rounded-input border-0 bg-transparent text-label-sm font-medium focus:outline-none focus:ring-1 focus:ring-pitch-blue ${RISK_COLORS[zone.risk_level] ?? ''}`}
                >
                  {['SAFE', 'MODERATE', 'WARNING', 'CRITICAL'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <button
          id="run-allocation-btn"
          onClick={handleAllocate}
          disabled={loading}
          className="flex items-center gap-2 rounded-input bg-pitch-blue px-5 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-pitch-blue-light disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-pitch-blue focus-visible:ring-offset-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Users className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? 'Calculating…' : 'Run Allocation'}
        </button>
      </section>

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-crowd-critical/30 bg-crowd-critical/5 p-4">
          <AlertTriangle className="h-5 w-5 text-crowd-critical shrink-0" aria-hidden="true" />
          <p className="text-body-sm text-crowd-critical">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Allocations */}
          <section aria-label="Staff allocations" className="card-surface p-5 space-y-3">
            <h2 className="text-heading-sm text-text-primary flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-crowd-safe" aria-hidden="true" />
              Allocations
              <span className="ml-auto text-label-sm text-text-secondary">
                {result.total_allocated} total assigned
              </span>
            </h2>
            <div className="space-y-2">
              {zones.map((zone) => {
                const assigned = result.allocations[zone.id] ?? 0;
                return (
                  <div key={zone.id} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-body-sm text-text-secondary truncate" title={zone.name}>
                      {zone.name}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-pill bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-pill bg-pitch-blue transition-all"
                          style={{ width: `${Math.min((assigned / availableStaff) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-36 justify-end">
                      <span className="text-body-sm font-medium text-text-primary">
                        {assigned} staff
                      </span>
                      <span className={`rounded-pill px-2 py-0.5 text-label-sm ${RISK_BADGE[zone.risk_level] ?? ''}`}>
                        {zone.risk_level}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Relocations */}
          {result.relocations.length > 0 && (
            <section aria-label="Relocation suggestions" className="card-surface p-5 space-y-3">
              <h2 className="text-heading-sm text-text-primary flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-crowd-warning" aria-hidden="true" />
                Suggested Relocations
              </h2>
              <p className="text-label-sm text-text-secondary">
                Move volunteers from low-risk zones to cover higher-risk areas.
              </p>
              <ul className="space-y-2">
                {result.relocations.map((r, i) => {
                  const fromName = zones.find((z) => z.id === r.from_zone)?.name ?? r.from_zone;
                  const toName = zones.find((z) => z.id === r.to_zone)?.name ?? r.to_zone;
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-crowd-warning/5 border border-crowd-warning/20 px-4 py-2.5"
                    >
                      <span className="text-body-sm text-text-secondary">{fromName}</span>
                      <ArrowRight className="h-4 w-4 text-crowd-warning shrink-0" aria-hidden="true" />
                      <span className="text-body-sm font-medium text-text-primary">{toName}</span>
                      <span className="ml-auto text-label-sm text-crowd-warning">
                        {r.count} volunteer{r.count !== 1 ? 's' : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.relocations.length === 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-crowd-safe/30 bg-crowd-safe/5 p-4">
              <CheckCircle className="h-5 w-5 text-crowd-safe shrink-0" aria-hidden="true" />
              <p className="text-body-sm text-crowd-safe">
                No relocations needed — current distribution is optimal for the given risk levels.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VolunteerPanel;
