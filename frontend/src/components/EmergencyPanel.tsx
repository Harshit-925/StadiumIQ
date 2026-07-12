import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { triageIncident } from '../api/client';
import type { EmergencyResponse } from '../types';

const ZONES = [
  { id: 'gate_a', name: 'Gate A' },
  { id: 'gate_b', name: 'Gate B' },
  { id: 'gate_c', name: 'Gate C' },
  { id: 'concourse_north', name: 'North Concourse' },
  { id: 'concourse_south', name: 'South Concourse' },
  { id: 'section_lower_bowl', name: 'Lower Bowl' },
  { id: 'section_upper_bowl', name: 'Upper Bowl' },
];

const INCIDENT_TYPES = [
  { id: 'medical', name: 'Medical Emergency' },
  { id: 'violence', name: 'Disturbance / Violence' },
  { id: 'suspicious_package', name: 'Suspicious Package' },
  { id: 'unauthorized_entry', name: 'Unauthorized Entry' },
  { id: 'spill', name: 'Spill / Hazard' },
];



export function EmergencyPanel() {
  const [incidentType, setIncidentType] = useState('medical');
  const [severity, setSeverity] = useState(3);
  const [zone, setZone] = useState('gate_a');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmergencyResponse | null>(null);

  async function handleTriage(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await triageIncident(incidentType, severity, zone);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to process triage.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="h-8 w-8 text-status-critical" />
        <h1 className="text-heading-lg font-display text-text-primary">Emergency Triage</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-card bg-surface p-6 shadow-sm border border-status-critical/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-status-critical"></div>
            <h2 className="text-heading-sm font-display mb-4">Report Incident</h2>
            
            <form onSubmit={handleTriage} className="space-y-4">
              <div>
                <label htmlFor="incident_select" className="block text-label-sm text-text-secondary mb-1">Incident Type</label>
                <select 
                  id="incident_select"
                  className="w-full rounded-input border border-gray-200 px-3 py-2 text-body-sm focus:border-status-critical focus:ring-1 focus:ring-status-critical outline-none"
                  value={incidentType}
                  onChange={e => setIncidentType(e.target.value)}
                >
                  {INCIDENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="zone_select" className="block text-label-sm text-text-secondary mb-1">Zone Location</label>
                <select 
                  id="zone_select"
                  className="w-full rounded-input border border-gray-200 px-3 py-2 text-body-sm focus:border-status-critical focus:ring-1 focus:ring-status-critical outline-none"
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                >
                  {ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-label-sm text-text-secondary mb-1">
                  Severity Level: {severity} ({severity >= 4 ? 'Critical' : severity === 3 ? 'Moderate' : 'Low'})
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={severity}
                  onChange={e => setSeverity(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-status-critical"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>1 (Low)</span>
                  <span>5 (High)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-input bg-status-critical px-4 py-2.5 text-body-md font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 mt-4"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                <span>Generate Action Plan</span>
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
              <div className="rounded-card bg-surface p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-heading-md font-display">Triage Assessment</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    result.priority_level === 'Critical' ? 'bg-status-critical/10 text-status-critical' :
                    result.priority_level === 'Moderate' ? 'bg-status-warning/10 text-status-warning' :
                    'bg-status-safe/10 text-status-safe'
                  }`}>
                    {result.priority_level} Priority
                  </span>
                </div>
                
                <div className="flex gap-3 mb-6">
                  {result.requires_medical && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                      <Info className="h-3.5 w-3.5" /> Medical Required
                    </span>
                  )}
                  {result.requires_police && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-800 border border-gray-300 text-xs font-semibold">
                      <ShieldAlert className="h-3.5 w-3.5" /> Law Enforcement Required
                    </span>
                  )}
                </div>

                <h4 className="text-body-md font-semibold text-text-primary mb-3">AI Executive Brief:</h4>
                <div className="mb-6 p-4 rounded bg-pitch-blue/5 border border-pitch-blue/20">
                  <p className="text-body-md text-text-primary">{result.ai_brief}</p>
                </div>

                <h4 className="text-body-md font-semibold text-text-primary mb-3">Recommended Action Plan:</h4>
                <div className="space-y-3">
                  {result.action_plan.map((action: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded bg-gray-50 border border-gray-100">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-status-critical/10 text-status-critical flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-body-md text-text-primary mt-0.5">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-card border-2 border-dashed border-gray-200 bg-surface/50 p-6 text-center">
              <ShieldAlert className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-heading-sm font-display text-text-primary">Decision Support</h3>
              <p className="mt-1 max-w-sm text-body-sm text-text-secondary">
                Submit incident details to generate an automated triage assessment and action plan based on standard protocols.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
