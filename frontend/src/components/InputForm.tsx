import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { analyzeVenue } from '../api/client';
import { pb } from '../api/pocketbase';
import { venueAnalysisSchema } from '../utils/validation';
import type { ZodError } from 'zod';

export function InputForm() {
  const selectedVenue = useAppStore((s) => s.selectedVenue);
  const isLoading = useAppStore((s) => s.isLoading);
  const setLoading = useAppStore((s) => s.setLoading);
  const setAnalysisResult = useAppStore((s) => s.setAnalysisResult);
  const setError = useAppStore((s) => s.setError);
  const addHistoryEntry = useAppStore((s) => s.addHistoryEntry);
  const shouldReduceMotion = useReducedMotion() ?? false;

  const zoneCount = selectedVenue.zones;
  const [zoneDensities, setZoneDensities] = useState<number[]>(
    Array(zoneCount).fill(2.0) as number[],
  );
  const [totalSpectators, setTotalSpectators] = useState(
    Math.floor(selectedVenue.capacity * 0.8),
  );
  const [wasteRecycled, setWasteRecycled] = useState(150);
  const [totalWaste, setTotalWaste] = useState(300);
  const [riskLevel, setRiskLevel] = useState<'low' | 'high'>('low');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleZoneDensityChange = useCallback(
    (index: number, value: number) => {
      setZoneDensities((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = {
      venue_id: selectedVenue.id,
      zone_densities: zoneDensities,
      spectator_count: totalSpectators,
      waste_recycled_kg: wasteRecycled,
      waste_total_kg: totalWaste,
      risk_level: riskLevel,
    };

    try {
      venueAnalysisSchema.parse(formData);
    } catch (err) {
      if ((err as ZodError).issues) {
        const zodErr = err as ZodError;
        const errors: Record<string, string> = {};
        zodErr.issues.forEach((issue) => {
          const field = String(issue.path[0] ?? 'form');
          errors[field] = issue.message;
        });
        setFieldErrors(errors);
        toast.error('Please fix the form errors before submitting.');
        return;
      }
    }

    setLoading(true);
    try {
      const result = await analyzeVenue(formData);
      setAnalysisResult(result);
      addHistoryEntry({
        id: crypto.randomUUID(),
        venue: result.venue,
        timestamp: result.timestamp,
        average_density: result.average_density,
        crowd_score: result.crowd_score,
        overall_grade: result.overall_grade,
      });
      
      // Save to PocketBase if authenticated
      if (pb.authStore.isValid && pb.authStore.model) {
        try {
          await pb.collection('history').create({
            user: pb.authStore.model.id,
            venue_id: selectedVenue.id,
            engine_result: result,
            ai_result: result.ai_insights ? { text: result.ai_insights } : null,
            fallback_used: result.ai_fallback,
          });
        } catch (pbErr) {
          console.error('Failed to save history to PocketBase:', pbErr);
          // Non-fatal, just local history will be available
        }
      }

      toast.success(`Analysis complete — Grade: ${result.overall_grade}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(message);
      toast.error(message);
    }
  };

  const getDensityColor = (density: number): string => {
    if (density < 2) return 'text-crowd-safe';
    if (density < 3.5) return 'text-crowd-moderate';
    if (density < 4.5) return 'text-crowd-warning';
    return 'text-crowd-critical';
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
      className="card-surface p-6"
    >
      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        Crowd Analysis Input
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        {/* Zone Densities */}
        <fieldset className="mb-6">
          <legend className="mb-3 text-sm font-medium text-text-primary">
            Zone Densities (pax/m²)
          </legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {zoneDensities.map((density, index) => (
              <div key={index}>
                <label
                  htmlFor={`zone-density-${index}`}
                  className="mb-1 block text-xs text-text-secondary"
                >
                  Zone {index + 1}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`zone-density-${index}`}
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={density}
                    onChange={(e) =>
                      handleZoneDensityChange(index, parseFloat(e.target.value))
                    }
                    aria-label={`Zone ${index + 1} density: ${density} pax per square meter`}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-pill bg-gray-100 accent-pitch-blue"
                  />
                  <span
                    className={`w-10 text-right text-sm font-mono font-medium ${getDensityColor(density)}`}
                  >
                    {density.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {fieldErrors.zone_densities && (
            <p className="mt-1 text-sm text-crowd-critical" role="alert">
              {fieldErrors.zone_densities}
            </p>
          )}
        </fieldset>

        {/* Spectator Count */}
        <div className="mb-4">
          <label
            htmlFor="total-spectators"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Total Spectators
          </label>
          <input
            id="total-spectators"
            type="number"
            min={0}
            max={selectedVenue.capacity}
            value={totalSpectators}
            onChange={(e) => setTotalSpectators(parseInt(e.target.value, 10) || 0)}
            aria-required="true"
            aria-describedby={
              fieldErrors.total_spectators
                ? 'spectators-error'
                : 'spectators-hint'
            }
            className="w-full rounded-input border border-gray-200 bg-base-bg px-4 py-2.5 text-text-primary transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
          />
          <p id="spectators-hint" className="mt-1 text-xs text-text-secondary/70">
            Max capacity: {selectedVenue.capacity.toLocaleString()}
          </p>
          {fieldErrors.total_spectators && (
            <p id="spectators-error" className="mt-1 text-sm text-crowd-critical" role="alert">
              {fieldErrors.total_spectators}
            </p>
          )}
        </div>

        {/* Waste Metrics */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="waste-recycled"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Waste Recycled (kg)
            </label>
            <input
              id="waste-recycled"
              type="number"
              min={0}
              value={wasteRecycled}
              onChange={(e) => setWasteRecycled(parseFloat(e.target.value) || 0)}
              aria-required="true"
              className="w-full rounded-input border border-gray-200 bg-base-bg px-4 py-2.5 text-text-primary transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
            />
          </div>
          <div>
            <label
              htmlFor="total-waste"
              className="mb-1.5 block text-sm font-medium text-text-primary"
            >
              Total Waste (kg)
            </label>
            <input
              id="total-waste"
              type="number"
              min={0}
              value={totalWaste}
              onChange={(e) => setTotalWaste(parseFloat(e.target.value) || 0)}
              aria-required="true"
              className="w-full rounded-input border border-gray-200 bg-base-bg px-4 py-2.5 text-text-primary transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
            />
          </div>
        </div>

        {/* Risk Level */}
        <fieldset className="mb-6">
          <legend className="mb-2 text-sm font-medium text-text-primary">
            Risk Level
          </legend>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <input
                id="risk-low"
                type="radio"
                name="risk-level"
                value="low"
                checked={riskLevel === 'low'}
                onChange={() => setRiskLevel('low')}
                className="h-4 w-4 accent-pitch-blue"
              />
              <label htmlFor="risk-low" className="text-sm text-text-secondary">
                Low Risk
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="risk-high"
                type="radio"
                name="risk-level"
                value="high"
                checked={riskLevel === 'high'}
                onChange={() => setRiskLevel('high')}
                className="h-4 w-4 accent-crowd-critical"
              />
              <label htmlFor="risk-high" className="text-sm text-text-secondary">
                High Risk
              </label>
            </div>
          </div>
        </fieldset>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-input bg-pitch-blue px-6 py-3 font-semibold text-white transition-colors hover:bg-pitch-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Run Analysis
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
