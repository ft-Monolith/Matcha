import { useEffect } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import { API } from "@web/API/api";
import { $user, $authReady, $use } from "@web/observables/observables";
import { MainWindow } from "@web/view/MainWindow";
import { AuthView } from "@web/view/auth/authView";
import { VerifyEmailView } from "@web/view/auth/VerifyEmailView";
import { ResetPasswordView } from "@web/view/auth/ResetPasswordView";

export function App() {
  const authReady = $use($authReady);
  const user = $use($user);

  function isConnected() {
       API.auth.me().then((r) => {
      $user.set(r.error ? null : r.data);
      $authReady.set(true);
    });
  }

  useEffect(() => {
    isConnected();
  }, []);

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  return (
    <BrowserRouter>
      <RouterRoutes>
        <Route path="/verify-email" element={<VerifyEmailView />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="*" element={user ? <MainWindow /> : <AuthView />} />
      </RouterRoutes>
    </BrowserRouter>
  );
}
