import React, { useState } from 'react';
import { Compass, Info, Loader2, AlertTriangle, Play } from 'lucide-react';
import { navigateVenue } from '../api/client';
import type { NavigationResponse } from '../types';

const ZONES = [
  { id: 'gate_a', name: 'Gate A' },
  { id: 'gate_b', name: 'Gate B' },
  { id: 'gate_c', name: 'Gate C' },
  { id: 'concourse_north', name: 'North Concourse' },
  { id: 'concourse_east', name: 'East Concourse' },
  { id: 'concourse_south', name: 'South Concourse' },
  { id: 'concourse_west', name: 'West Concourse' },
  { id: 'section_lower_bowl', name: 'Lower Bowl' },
  { id: 'section_upper_bowl', name: 'Upper Bowl' },
  { id: 'family_zone', name: 'Family Zone' },
  { id: 'press_zone', name: 'Press Zone' },
  { id: 'accessible_seating', name: 'Accessible Seating' },
  { id: 'medical_station', name: 'Medical Station' },
];



export function NavigationPanel() {
  const [origin, setOrigin] = useState('gate_a');
  const [destination, setDestination] = useState('section_lower_bowl');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NavigationResponse | null>(null);

  async function handleNavigate(e: React.FormEvent) {
    e.preventDefault();
    if (origin === destination) {
      setError("Origin and destination must be different.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // the real backend route is POST /api/navigate
      const data = await navigateVenue(origin, destination, accessibleOnly, 'en');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to calculate route.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Compass className="h-8 w-8 text-pitch-blue" />
        <h1 className="text-heading-lg font-display text-text-primary">Zone Navigation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-card bg-surface p-6 shadow-sm border border-gray-100">
            <h2 className="text-heading-sm font-display mb-4">Route Planner</h2>
            
            <form onSubmit={handleNavigate} className="space-y-4">
              <div>
                <label htmlFor="origin_select" className="block text-label-sm text-text-secondary mb-1">Starting Point</label>
                <select 
                  id="origin_select"
                  className="w-full rounded-input border border-gray-200 px-3 py-2 text-body-sm focus:border-pitch-blue focus:ring-2 focus:ring-pitch-blue focus:ring-offset-2 focus-visible:outline-none"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                >
                  {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="destination_select" className="block text-label-sm text-text-secondary mb-1">Destination</label>
                <select 
                  id="destination_select"
                  className="w-full rounded-input border border-gray-200 px-3 py-2 text-body-sm focus:border-pitch-blue focus:ring-2 focus:ring-pitch-blue focus:ring-offset-2 focus-visible:outline-none"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                >
                  {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="accessibleOnly" 
                  checked={accessibleOnly}
                  onChange={e => setAccessibleOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-pitch-blue focus:ring-pitch-blue"
                />
                <label htmlFor="accessibleOnly" className="text-body-sm text-text-secondary">
                  Accessible (step-free) route only
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-input bg-pitch-blue px-4 py-2.5 text-body-md font-semibold text-white transition-colors hover:bg-pitch-blue-light disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>Calculate Route</span>
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-6 rounded-card border border-status-critical/20 bg-status-critical/10 p-4 text-status-critical">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold text-body-md">{error}</span>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Narrative Overlay */}
              <div className="rounded-card bg-surface p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-pitch-blue/10 p-2">
                    <Info className="h-5 w-5 text-pitch-blue" />
                  </div>
                  <div>
                    <h3 className="text-heading-sm font-display mb-2">Route Summary</h3>
                    <p className="text-body-md text-text-secondary">{result.narrative}</p>
                    <div className="mt-4 flex gap-4">
                      <div className="bg-gray-50 px-4 py-2 rounded border border-gray-100">
                        <span className="block text-label-sm text-text-secondary">Total Time</span>
                        <span className="text-heading-sm font-semibold text-pitch-blue">{result.total_minutes} min</span>
                      </div>
                      <div className="bg-gray-50 px-4 py-2 rounded border border-gray-100">
                        <span className="block text-label-sm text-text-secondary">Accessible</span>
                        <span className={`text-heading-sm font-semibold ${result.accessible ? 'text-status-safe' : 'text-status-warning'}`}>
                          {result.accessible ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step by step */}
              <div className="rounded-card bg-surface p-6 shadow-sm border border-gray-100">
                <h3 className="text-heading-sm font-display mb-4">Step-by-Step Directions</h3>
                <div className="space-y-0">
                  {result.steps.map((step, idx: number) => (
                    <div key={idx} className="relative pl-6 pb-6 last:pb-0">
                      {idx !== result.steps.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200"></div>
                      )}
                      <div className="absolute left-0 top-1.5 h-[24px] w-[24px] rounded-full bg-pitch-blue/10 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-pitch-blue"></div>
                      </div>
                      <div className="ml-4">
                        <p className="text-body-md font-semibold text-text-primary">{step.instruction}</p>
                        <p className="text-body-sm text-text-secondary mt-1">Estimated walk: {step.minutes} minutes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-card border-2 border-dashed border-gray-200 bg-surface/50 p-6 text-center">
              <Compass className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-heading-sm font-display text-text-primary">Ready to Plan</h3>
              <p className="mt-1 max-w-sm text-body-sm text-text-secondary">
                Select an origin and destination to generate a walking route.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
