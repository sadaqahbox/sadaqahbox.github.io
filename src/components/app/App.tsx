import { Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "@/components/auth";
import { AccountPage } from "@/components/account";
import { ProtectedDashboard } from "@/components/dashboard";
import { LandingPage } from "@/components/landing";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<ProtectedDashboard />} />
      <Route path="/auth/:pathname" element={<AuthPage />} />
      <Route path="/account/:pathname" element={<AccountPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
