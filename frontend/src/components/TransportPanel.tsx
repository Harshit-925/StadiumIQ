import { useState, useEffect, useCallback } from 'react';
import { Bus, Car, AlertTriangle, RefreshCcw, Sparkles } from 'lucide-react';
import { getTransportOptions } from '../api/client';
import type { TransportResponse } from '../types';

export function TransportPanel() {
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TransportResponse | null>(null);

  const fetchTransport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransportOptions(accessibleOnly);
      setData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transport data.');
    } finally {
      setLoading(false);
    }
  }, [accessibleOnly]);

  useEffect(() => {
    fetchTransport();
  }, [fetchTransport]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bus className="h-8 w-8 text-pitch-blue" />
          <h1 className="text-heading-lg font-display text-text-primary">Transport Options</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="accOnly" 
              checked={accessibleOnly}
              onChange={e => setAccessibleOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-pitch-blue focus:ring-pitch-blue"
            />
            <label htmlFor="accOnly" className="text-body-sm text-text-secondary">
              Accessible Options Only
            </label>
          </div>
          <button 
            onClick={fetchTransport}
            disabled={loading}
            aria-label="Refresh transport options"
            className="flex items-center gap-2 rounded bg-surface px-3 py-1.5 text-body-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-card border border-status-critical/20 bg-status-critical/10 p-4 text-status-critical">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold text-body-md">{error}</span>
          </div>
        </div>
      )}

      {!error && data && (
        <>
          {data.ai_insights && (
            <div className="mb-6 rounded-card border border-stadium-green/20 bg-stadium-green/5 p-4 flex gap-4 items-start shadow-sm">
              <div className="rounded-full bg-stadium-green/20 p-2 text-stadium-green shrink-0 mt-0.5">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-body-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">AI Recommendation</h3>
                <p className="text-body-md text-text-primary leading-relaxed">{data.ai_insights}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parking Options */}
          <div className="space-y-4">
            <h2 className="text-heading-md font-display flex items-center gap-2">
              <Car className="h-5 w-5 text-text-secondary" />
              Parking Recommendations
            </h2>
            
            {data.parking.map((lot, idx) => (
              <div key={lot.id} className={`rounded-card bg-surface p-4 border shadow-sm ${idx === 0 ? 'border-pitch-blue/50 bg-pitch-blue/5' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-heading-sm font-semibold">{lot.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    lot.status === 'Open' ? 'bg-status-safe/10 text-status-safe' : 'bg-status-critical/10 text-status-critical'
                  }`}>
                    {lot.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="block text-label-sm text-text-secondary">Occupancy</span>
                    <span className={`text-body-md font-semibold ${lot.occupancy_pct >= 95 ? 'text-status-critical' : 'text-text-primary'}`}>
                      {lot.occupancy_pct}% ({lot.capacity} total)
                    </span>
                  </div>
                  <div>
                    <span className="block text-label-sm text-text-secondary">Walk Time</span>
                    <span className="text-body-md font-semibold text-text-primary">{lot.walk_time_mins} min</span>
                  </div>
                  <div>
                    <span className="block text-label-sm text-text-secondary">Accessible Spaces</span>
                    <span className="text-body-md font-semibold text-text-primary">{lot.accessible_spaces}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {data.parking.length === 0 && (
              <div className="p-8 text-center text-text-secondary bg-surface rounded-card border border-dashed border-gray-200">
                No parking options found matching your criteria.
              </div>
            )}
          </div>

          {/* Transit Options */}
          <div className="space-y-4">
            <h2 className="text-heading-md font-display flex items-center gap-2">
              <Bus className="h-5 w-5 text-text-secondary" />
              Public Transit & Shuttles
            </h2>
            
            {data.transit.map((route, idx) => (
              <div key={route.id} className={`rounded-card bg-surface p-4 border shadow-sm ${idx === 0 ? 'border-pitch-blue/50 bg-pitch-blue/5' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-heading-sm font-semibold">{route.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    route.status === 'Running' ? 'bg-status-safe/10 text-status-safe' : 'bg-status-warning/10 text-status-warning'
                  }`}>
                    {route.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="block text-label-sm text-text-secondary">Frequency</span>
                    <span className="text-body-md font-semibold text-text-primary">Every {route.frequency_mins} min</span>
                  </div>
                  <div>
                    <span className="block text-label-sm text-text-secondary">Crowd Level</span>
                    <span className={`text-body-md font-semibold ${
                      route.crowd_level === 'High' ? 'text-status-warning' : 
                      route.crowd_level === 'Medium' ? 'text-text-primary' : 'text-status-safe'
                    }`}>
                      {route.crowd_level}
                    </span>
                  </div>
                  <div>
                    <span className="block text-label-sm text-text-secondary">Accessible</span>
                    <span className="text-body-md font-semibold text-text-primary">{route.accessible ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="block text-label-sm text-text-secondary">Type</span>
                    <span className="text-body-md font-semibold text-text-primary">{route.type}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {data.transit.length === 0 && (
              <div className="p-8 text-center text-text-secondary bg-surface rounded-card border border-dashed border-gray-200">
                No transit options found matching your criteria.
              </div>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
