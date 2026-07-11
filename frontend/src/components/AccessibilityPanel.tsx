/**
 * AccessibilityPanel — Dedicated operator screen for wheelchair seating compliance.
 *
 * Honest progress-to-target indicator (not a gauge).
 * ADA minimum: 1% wheelchair seating (ADAAG 4.33.2).
 * Data-driven when analysis result exists; static VENUES data otherwise.
 */
import { useMemo } from 'react';
import { Accessibility, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { VENUES } from '../types';

const ADA_MINIMUM_PCT = 1.0; // ADAAG 4.33.2: 1 wheelchair space per 100 seats

interface VenueRow {
  id: string;
  name: string;
  city: string;
  ratioPct: number;
  isCompliant: boolean;
  isSelected: boolean;
  isLive: boolean; // has real analysis data
}

export function AccessibilityPanel() {
  const selectedVenue = useAppStore((s) => s.selectedVenue);
  const analysisResult = useAppStore((s) => s.analysisResult);

  const rows = useMemo((): VenueRow[] => {
    return Object.values(VENUES).map((venue) => {
      const isSelected = venue.id === selectedVenue.id;
      const isLive = isSelected && !!analysisResult;

      // Use live analysis data for the selected venue if available
      const ratioPct = isLive && analysisResult
        ? analysisResult.wheelchair_ratio * 100
        : (venue.wheelchair_seats / venue.capacity) * 100;

      return {
        id: venue.id,
        name: venue.name,
        city: venue.city,
        ratioPct,
        isCompliant: ratioPct >= ADA_MINIMUM_PCT,
        isSelected,
        isLive,
      };
    });
  }, [selectedVenue, analysisResult]);

  const compliantCount = rows.filter((r) => r.isCompliant).length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-heading-xl text-text-primary flex items-center gap-2">
          <Accessibility className="h-6 w-6 text-pitch-blue" aria-hidden="true" />
          Accessibility Compliance
        </h1>
        <p className="mt-1 text-body-sm text-text-secondary">
          Wheelchair seating ratio per venue vs. ADA minimum 1% (ADAAG 4.33.2).
          FIFA recommends 1.5% for new facilities.
        </p>
      </div>

      {/* Summary badge */}
      <div className="card-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-md text-text-secondary uppercase tracking-wide">
              Venues Meeting ADA Minimum
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-data text-data-2xl text-text-primary">{compliantCount}</span>
              <span className="text-body-sm text-text-secondary">/ {rows.length} venues</span>
            </div>
          </div>
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${
              compliantCount === rows.length
                ? 'bg-crowd-safe/10 text-crowd-safe'
                : 'bg-crowd-warning/10 text-crowd-warning'
            }`}
          >
            {compliantCount === rows.length ? (
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      {/* Venue table */}
      <section aria-label="Per-venue accessibility compliance">
        <div className="card-surface overflow-x-auto">
          <table className="w-full table-fixed" aria-label="Wheelchair seating compliance by venue">
            <thead>
              <tr className="border-b border-gray-100">
                <th scope="col" className="px-4 py-3 text-left text-label-md text-text-secondary font-medium uppercase tracking-wide w-2/3 sm:w-1/2">
                  Venue
                </th>
                <th scope="col" className="px-4 py-3 text-left text-label-md text-text-secondary font-medium uppercase tracking-wide w-1/3 sm:w-1/4">
                  Ratio
                </th>
                <th scope="col" className="hidden px-4 py-3 text-left text-label-md text-text-secondary font-medium uppercase tracking-wide sm:table-cell sm:w-1/4">
                  vs. ADA 1%
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-50 transition-colors ${
                    row.isSelected ? 'bg-pitch-blue/3' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="text-body-sm font-medium text-text-primary">
                      {row.isCompliant ? (
                        <>
                          <CheckCircle2 className="inline-block h-4 w-4 text-crowd-safe mr-1.5 -mt-0.5" aria-hidden="true" />
                          <span className="sr-only">ADA Compliant</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="inline-block h-4 w-4 text-crowd-warning mr-1.5 -mt-0.5" aria-hidden="true" />
                          <span className="sr-only">Below Threshold</span>
                        </>
                      )}
                      {row.name}
                      {row.isSelected && (
                        <span className="ml-2 rounded-pill bg-pitch-blue/10 px-1.5 py-0.5 text-label-sm text-pitch-blue">
                          Selected
                        </span>
                      )}
                      {row.isLive && (
                        <span className="ml-1 rounded-pill bg-stadium-green/10 px-1.5 py-0.5 text-label-sm text-stadium-green">
                          Live
                        </span>
                      )}
                    </p>
                    <p className="text-label-sm text-text-secondary">{row.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-data text-data-sm text-text-primary">
                      {row.ratioPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="progress-track flex-1 max-w-[96px]">
                        <div
                          className={row.isCompliant ? 'progress-fill-safe' : 'progress-fill-warning'}
                          style={{ width: `${Math.min((row.ratioPct / 2) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-label-sm text-text-secondary whitespace-nowrap flex-shrink-0">
                        {row.ratioPct >= ADA_MINIMUM_PCT
                          ? `+${(row.ratioPct - ADA_MINIMUM_PCT).toFixed(2)}%`
                          : `-${(ADA_MINIMUM_PCT - row.ratioPct).toFixed(2)}%`}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-label-sm text-text-secondary">
          Source: ADAAG §4.33.2. FIFA recommends 1.5% for new and renovated facilities.
          Live data shown for selected venue when an analysis has been run.
        </p>
      </section>
    </div>
  );
}

export default AccessibilityPanel;
