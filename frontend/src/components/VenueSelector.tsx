import { useAppStore } from '../store/useAppStore';
import { VENUE_GROUPS } from '../types';
import { MapPin } from 'lucide-react';

export function VenueSelector() {
  const selectedVenue = useAppStore((s) => s.selectedVenue);
  const setSelectedVenue = useAppStore((s) => s.setSelectedVenue);

  return (
    <div className="glass-surface p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="venue-select"
            className="mb-1.5 flex items-center gap-2 text-sm font-medium text-white/80"
          >
            <MapPin className="h-4 w-4 text-stadium-blue" aria-hidden="true" />
            Select Venue
          </label>
          <select
            id="venue-select"
            value={selectedVenue.id}
            onChange={(e) => setSelectedVenue(e.target.value)}
            aria-label="Select a FIFA World Cup 2026 venue"
            className="w-full rounded-input border border-white/10 bg-dark-surface px-4 py-2.5 text-white transition-colors focus:border-stadium-blue focus:outline-none focus:ring-2 focus:ring-stadium-blue/50"
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

        <div className="flex flex-wrap gap-4 text-sm text-white/60">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-white/80">Capacity:</span>
            <span className="text-fifa-gold">
              {selectedVenue.capacity.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-white/80">Zones:</span>
            <span className="text-fifa-gold">{selectedVenue.zones}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-white/80">Exit Width:</span>
            <span className="text-fifa-gold">{selectedVenue.exit_width_m}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-white/80">Wheelchair:</span>
            <span className="text-fifa-gold">{selectedVenue.wheelchair_seats}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
