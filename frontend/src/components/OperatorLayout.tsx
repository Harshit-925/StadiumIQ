/**
 * OperatorLayout — Shared shell for all protected /dashboard/* routes.
 *
 * Responsive:
 * - ≥1024px (desktop/landscape tablet): fixed 260px sidebar + top bar
 * - <1024px (portrait tablet/mobile): top bar + bottom tab bar (4 tabs)
 *   Bottom tabs give touch-reliable navigation without hover dependency.
 */
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Accessibility,
  Leaf,
  FileText,
  LogOut,
  LogIn,
  Compass,
  Bus,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { FanAssistant } from './FanAssistant';
import type { SupportedLanguage } from '../types';
import { LANGUAGE_LABELS } from '../types';
import { LANGUAGES } from './chat/constants';

const NAV_ITEMS = [
  { to: '/dashboard',              label: 'Overview',        icon: LayoutDashboard, end: true },
  { to: '/dashboard/crowd',        label: 'Crowd Intel',     icon: Users,           end: false },
  { to: '/dashboard/navigate',     label: 'Navigate',        icon: Compass,         end: false },
  { to: '/dashboard/transport',    label: 'Transport',       icon: Bus,             end: false },
  { to: '/dashboard/emergency',    label: 'Emergency',       icon: ShieldAlert,     end: false },
  { to: '/dashboard/volunteer',    label: 'Volunteers',      icon: Users,           end: false },
  { to: '/dashboard/accessibility',label: 'Accessibility',   icon: Accessibility,   end: false },
  { to: '/dashboard/sustainability',label:'Sustainability',  icon: Leaf,            end: false },
  { to: '/dashboard/report',       label: 'Report',          icon: FileText,        end: false },
] as const;

function NavItem({ to, label, icon: Icon, end }: typeof NAV_ITEMS[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm transition-colors duration-100
         ${isActive
           ? 'border-l-4 border-pitch-blue bg-pitch-blue/8 font-semibold text-pitch-blue pl-2'
           : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
         }`
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

function BottomTab({ to, label, icon: Icon, end }: typeof NAV_ITEMS[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-0.5 py-2
         text-label-sm transition-colors duration-100
         ${isActive ? 'text-pitch-blue' : 'text-text-secondary'}`
      }
      aria-label={label}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-[10px] leading-none">{label}</span>
    </NavLink>
  );
}

export function OperatorLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const selectedVenue = useAppStore((s) => s.selectedVenue);
  const analysisResult = useAppStore((s) => s.analysisResult);
  const globalLanguage = useAppStore((s) => s.language);
  const setGlobalLanguage = useAppStore((s) => s.setLanguage);
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleLogin() {
    navigate('/login', { state: { from: location.pathname } });
  }

  return (
    <div className="min-h-screen bg-base-bg">
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-30 flex h-[60px] items-center justify-between border-b border-gray-200 bg-surface px-4 sm:px-6"
        role="banner"
      >
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80" aria-label="StadiumIQ Home">
            <Activity className="h-6 w-6 text-pitch-blue" aria-hidden="true" />
            <span className="text-heading-sm font-display text-pitch-blue">
              Stadium<span className="text-trophy-gold">IQ</span>
            </span>
          </Link>
          <span className="hidden text-label-sm text-text-secondary sm:inline">
            · {selectedVenue.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <select
              value={globalLanguage}
              onChange={(e) => setGlobalLanguage(e.target.value as SupportedLanguage)}
              aria-label="Global language selector"
              className="rounded-input bg-gray-100 px-2 py-1 text-xs text-text-secondary border-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pitch-blue"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <>
              <span className="hidden text-body-sm text-text-secondary lg:inline">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-input border border-gray-200 px-3 py-1.5 text-body-sm text-text-secondary transition-colors hover:border-gray-300 hover:text-text-primary focus-visible:ring-2 focus-visible:ring-pitch-blue"
                aria-label="Log out of StadiumIQ"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-1.5 rounded-input bg-pitch-blue px-4 py-1.5 text-body-sm font-semibold text-white transition-colors hover:bg-pitch-blue-light focus-visible:ring-2 focus-visible:ring-pitch-blue focus-visible:ring-offset-2"
              aria-label="Log in or register"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Log In / Register</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Sidebar (desktop/landscape tablet ≥1024px) ──────────────── */}
      <aside
        className="fixed left-0 top-[60px] hidden h-[calc(100vh-60px)] w-[260px] flex-col border-r border-gray-200 bg-surface p-4 lg:flex"
        aria-label="Operator navigation"
      >
        <nav className="flex flex-col gap-1" aria-label="Dashboard sections">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main
        id="main-content"
        className="pt-[60px] pb-[64px] lg:ml-[260px] lg:pb-0 flex flex-col min-h-screen"
        tabIndex={-1}
      >
        {/* ── Live Ticker Banner ────────────────────────────────────────── */}
        <div className="bg-pitch-blue text-white py-1.5 px-4 sm:px-6 flex items-center justify-between text-xs sm:text-sm font-semibold shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="status-dot-live bg-white" aria-hidden="true" />
              Live Status: {selectedVenue.name}
            </span>
            <span className="hidden sm:inline opacity-40">|</span>
            {analysisResult ? (
              <>
                <span>Grade: {analysisResult.overall_grade}</span>
                <span className="hidden sm:inline opacity-40">|</span>
                <span>Occupancy: {Math.round(analysisResult.average_density * 100)}%</span>
                <span className="hidden sm:inline opacity-40">|</span>
                <span className={analysisResult.evacuation_feasible ? 'text-green-300' : 'text-red-300'}>
                  Emergency: {analysisResult.evacuation_feasible ? 'Clear' : 'Critical'}
                </span>
              </>
            ) : (
              <span className="text-white/80">Awaiting Real-time Analysis...</span>
            )}
          </div>
        </div>

        <Outlet />
      </main>

      {/* ── Bottom Tab Bar (mobile/portrait tablet <1024px) ──────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex h-[64px] border-t border-gray-200 bg-surface lg:hidden"
        aria-label="Operator navigation"
      >
        {NAV_ITEMS.map((item) => (
          <BottomTab key={item.to} {...item} />
        ))}
      </nav>

      {/* ── Floating Fan Assistant (staff convenience) ───────────────── */}
      <FanAssistant />
    </div>
  );
}

export default OperatorLayout;
