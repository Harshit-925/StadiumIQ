import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy-loaded routes
const LandingPage = lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })));
const FanAssistantPage = lazy(() => import('./components/FanAssistantPage').then(module => ({ default: module.FanAssistantPage })));
const LoginPage = lazy(() => import('./components/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./components/SignupPage').then(module => ({ default: module.SignupPage })));
const OperatorLayout = lazy(() => import('./components/OperatorLayout').then(module => ({ default: module.OperatorLayout })));
const CrowdDashboard = lazy(() => import('./components/CrowdDashboard').then(module => ({ default: module.CrowdDashboard })));
const AccessibilityPanel = lazy(() => import('./components/AccessibilityPanel').then(module => ({ default: module.AccessibilityPanel })));
const SustainabilityTracker = lazy(() => import('./components/SustainabilityTracker').then(module => ({ default: module.SustainabilityTracker })));
const ReportExport = lazy(() => import('./components/ReportExport').then(module => ({ default: module.ReportExport })));

// Simple fallback for Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-base-bg flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-pitch-green border-t-transparent" role="status" aria-label="Loading page..." />
  </div>
);

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public routes ─────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/assistant" element={<FanAssistantPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* ── Public operator routes ──────────────────────────────── */}
        <Route element={<OperatorLayout />}>
          <Route path="/dashboard" element={<CrowdDashboard />} />
          <Route path="/dashboard/accessibility" element={<AccessibilityPanel />} />
          <Route path="/dashboard/sustainability" element={<SustainabilityTracker />} />
          <Route path="/dashboard/report" element={<ReportExport />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
