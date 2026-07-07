import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './components/LandingPage';
import { FanAssistantPage } from './components/FanAssistantPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { OperatorLayout } from './components/OperatorLayout';
import { CrowdDashboard } from './components/CrowdDashboard';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { SustainabilityTracker } from './components/SustainabilityTracker';
import { ReportExport } from './components/ReportExport';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ─────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/assistant" element={<FanAssistantPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* ── Protected operator routes ──────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<OperatorLayout />}>
            <Route path="/dashboard" element={<CrowdDashboard />} />
            <Route path="/dashboard/accessibility" element={<AccessibilityPanel />} />
            <Route path="/dashboard/sustainability" element={<SustainabilityTracker />} />
            <Route path="/dashboard/report" element={<ReportExport />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
