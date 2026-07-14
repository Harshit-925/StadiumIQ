import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Accessibility, Leaf, Bus, Compass, ShieldAlert, ChevronRight, Activity } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function OverviewPanel() {
  const currentVenue = useAppStore(state => state.selectedVenue);

  const tiles = [
    {
      title: 'Crowd Intelligence',
      description: 'Real-time density analytics, flow monitoring, and bottleneck detection across all stadium zones.',
      icon: Users,
      path: '/dashboard/crowd',
      color: 'text-pitch-blue',
      bg: 'bg-pitch-blue/10',
      border: 'border-pitch-blue/20',
      status: 'Active'
    },
    {
      title: 'Zone Navigation',
      description: 'Shortest-path Dijkstra routing between stadium gates, concourses, and amenities.',
      icon: Compass,
      path: '/dashboard/navigate',
      color: 'text-pitch-blue',
      bg: 'bg-pitch-blue/10',
      border: 'border-pitch-blue/20',
      status: 'Active'
    },
    {
      title: 'Transportation',
      description: 'Parking and transit reference guidance.',
      icon: Bus,
      path: '/dashboard/transport',
      color: 'text-pitch-blue',
      bg: 'bg-pitch-blue/10',
      border: 'border-pitch-blue/20',
      status: 'Active'
    },
    {
      title: 'Emergency Triage',
      description: 'Deterministic incident response protocols and AI executive briefing generation.',
      icon: ShieldAlert,
      path: '/dashboard/emergency',
      color: 'text-status-critical',
      bg: 'bg-status-critical/10',
      border: 'border-status-critical/20',
      status: 'Active'
    },
    {
      title: 'Accessibility',
      description: 'Compliance tracking for ADA requirements, wheelchair seating ratios, and ramps.',
      icon: Accessibility,
      path: '/dashboard/accessibility',
      color: 'text-pitch-blue',
      bg: 'bg-pitch-blue/10',
      border: 'border-pitch-blue/20',
      status: 'Active'
    },
    {
      title: 'Sustainability',
      description: 'Waste diversion rates, recycling metrics, and environmental footprint tracking.',
      icon: Leaf,
      path: '/dashboard/sustainability',
      color: 'text-status-safe',
      bg: 'bg-status-safe/10',
      border: 'border-status-safe/20',
      status: 'Active'
    },
    {
      title: 'Volunteer Operations',
      description: 'Shift management, zone coverage tracking, and automated task deployment.',
      icon: Users,
      path: '/dashboard/volunteer',
      color: 'text-trophy-gold',
      bg: 'bg-trophy-gold/10',
      border: 'border-trophy-gold/20',
      status: 'Active'
    },
    {
      title: 'Fan Assistant (AI)',
      description: 'Multilingual conversational agent providing venue support and match information.',
      icon: Activity,
      path: '/assistant',
      color: 'text-stadium-green',
      bg: 'bg-stadium-green/10',
      border: 'border-stadium-green/20',
      status: 'Live'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="h-8 w-8 text-pitch-blue" />
            <h1 className="text-heading-lg font-display text-text-primary">Stadium Overview</h1>
          </div>
          <p className="text-body-md text-text-secondary max-w-2xl">
            Welcome to the StadiumIQ command center for {currentVenue ? currentVenue.name : 'the selected venue'}. 
            Select a module below to view real-time data and actionable insights.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-status-safe/10 text-status-safe rounded-full border border-status-safe/20">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-semibold">System Operational</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tiles.map((tile, idx) => (
          <Link 
            key={idx} 
            to={tile.path}
            className={`group rounded-card p-6 bg-surface border transition-all hover:shadow-md hover:border-pitch-blue/40 flex flex-col h-full ${tile.border}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${tile.bg} ${tile.color}`}>
                <tile.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-text-secondary border border-gray-200">
                {tile.status}
              </span>
            </div>
            
            <h2 className="text-heading-md font-display mb-2 group-hover:text-pitch-blue transition-colors">
              {tile.title}
            </h2>
            
            <p className="text-body-sm text-text-secondary mb-6 flex-grow">
              {tile.description}
            </p>
            
            <div className="flex items-center text-sm font-semibold text-pitch-blue mt-auto">
              Open Module
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
