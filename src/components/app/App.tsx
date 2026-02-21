import { Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "@/components/auth";
import { ProtectedDashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="/auth/:pathname" element={<AuthPage />} />
      <Route path="/account/settings" element={<Navigate to="/auth/settings" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
