import { useAppStore } from '../store/useAppStore';
import { VENUE_GROUPS } from '../types';
import { MapPin } from 'lucide-react';

export function VenueSelector() {
  const selectedVenue = useAppStore((s) => s.selectedVenue);
  const setSelectedVenue = useAppStore((s) => s.setSelectedVenue);

  return (
    <div className="card-surface p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="venue-select"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-text-primary"
          >
            <MapPin className="h-4 w-4 text-pitch-blue" aria-hidden="true" />
            Select Venue
          </label>
          <select
            id="venue-select"
            value={selectedVenue.id}
            onChange={(e) => setSelectedVenue(e.target.value)}
            aria-label="Select a FIFA World Cup 2026 venue"
            className="w-full rounded-input border border-gray-200 bg-surface px-4 py-2.5 text-text-primary transition-colors focus:border-pitch-blue focus:outline-none focus:ring-2 focus:ring-pitch-blue/20"
          >
            {Object.entries(VENUE_GROUPS).map(([country, venues]) => (
              <optgroup key={country} label={`🏟️ ${country}`}>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} — {venue.city} ({venue.capacity.toLocaleString()})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-text-primary">Capacity:</span>
            <span className="text-trophy-gold">
              {selectedVenue.capacity.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-text-primary">Zones:</span>
            <span className="text-trophy-gold">{selectedVenue.zones}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-text-primary">Exit Width:</span>
            <span className="text-trophy-gold">{selectedVenue.exit_width_m}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-text-primary">Wheelchair:</span>
            <span className="text-trophy-gold">{selectedVenue.wheelchair_seats}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
