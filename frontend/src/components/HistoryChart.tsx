import { useMemo, memo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { HistoryEntry } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { BarChart2, TableIcon } from 'lucide-react';

/** Format a timestamp into a short human-readable label. */
function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Colour a density value using the G. Keith Still crowd-safety thresholds. */
function densityColor(d: number): string {
  if (d < 2) return '#10B981';
  if (d < 3.5) return '#F59E0B';
  if (d < 4.5) return '#F97316';
  return '#EF4444';
}

interface ChartPoint {
  time: string;
  density: number;
  grade: string;
  score: number;
  venue: string;
}

/** Accessible table view — gives screen-reader users the same data as the chart. */
const TableFallback = memo(function TableFallback({ data }: { data: ChartPoint[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-text-secondary">
        <caption className="sr-only">Analysis history data table</caption>
        <thead>
          <tr className="border-b border-gray-200">
            <th scope="col" className="py-2 pr-4 font-medium">Time</th>
            <th scope="col" className="py-2 pr-4 font-medium">Venue</th>
            <th scope="col" className="py-2 pr-4 font-medium">Avg Density (pax/m²)</th>
            <th scope="col" className="py-2 pr-4 font-medium">Grade</th>
            <th scope="col" className="py-2 font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="py-1.5 pr-4">{row.time}</td>
              <td className="py-1.5 pr-4">{row.venue}</td>
              <td className="py-1.5 pr-4" style={{ color: densityColor(row.density) }}>
                {row.density.toFixed(2)}
              </td>
              <td className="py-1.5 pr-4 font-semibold">{row.grade}</td>
              <td className="py-1.5">{row.score.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartPoint }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div
      className="card-surface border border-gray-200 p-3 text-xs text-text-primary"
      role="tooltip"
    >
      <p className="font-semibold text-text-primary">{point?.venue}</p>
      <p>Time: {label}</p>
      <p>Density: <span style={{ color: densityColor(payload[0]?.value ?? 0) }}>{(payload[0]?.value ?? 0).toFixed(2)} pax/m²</span></p>
      <p>Grade: <span className="font-bold text-text-primary">{point?.grade}</span></p>
    </div>
  );
};

export const HistoryChart = memo(function HistoryChart() {
  const history = useAppStore((s) => s.history);
  const [showTable, setShowTable] = useState(false);

  const chartData: ChartPoint[] = useMemo(
    () =>
      (history as HistoryEntry[]).map((h) => ({
        time: formatTime(h.timestamp),
        density: h.average_density,
        grade: h.overall_grade,
        score: h.crowd_score,
        venue: h.venue,
      })),
    [history],
  );

  if (chartData.length === 0) {
    return (
      <div className="card-surface flex h-40 items-center justify-center p-6">
        <p className="text-sm text-text-secondary/70">
          No history yet — run an analysis to see trends.
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          Crowd Density Trend
          <span className="ml-2 text-xs text-text-secondary/70">
            ({chartData.length} {chartData.length === 1 ? 'reading' : 'readings'})
          </span>
        </h3>
        <button
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          aria-label={showTable ? 'Switch to chart view' : 'Switch to table view (accessible)'}
          className="flex items-center gap-1.5 rounded border border-gray-200 px-2.5 py-1 text-xs text-text-primary/50 transition-colors hover:border-gray-300 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stadium-blue"
        >
          {showTable ? (
            <>
              <BarChart2 className="h-3.5 w-3.5" aria-hidden="true" />
              Chart
            </>
          ) : (
            <>
              <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Table
            </>
          )}
        </button>
      </div>

      {showTable ? (
        <TableFallback data={chartData} />
      ) : (
        /* Chart is aria-hidden — same data available via Table toggle */
        <div aria-hidden="true" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 6]}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Reference lines for density thresholds */}
              <ReferenceLine y={2} stroke="#10B981" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={3.5} stroke="#F59E0B" strokeDasharray="4 2" strokeOpacity={0.4} />
              <ReferenceLine y={4.5} stroke="#EF4444" strokeDasharray="4 2" strokeOpacity={0.4} />
              <Line
                type="monotone"
                dataKey="density"
                stroke="#1A56DB"
                strokeWidth={2}
                dot={{ r: 3, fill: '#1A56DB', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#F4A21B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Screen-reader note about the chart */}
      <p className="sr-only">
        Use the Table button above to access this chart data in tabular format.
      </p>
    </div>
  );
});
