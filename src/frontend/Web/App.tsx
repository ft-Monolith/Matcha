import { useEffect } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { API } from "@web/API/api";
import { $user, $authReady, $use } from "@web/observables/observables";
import { WebRoutes } from "@web/routes";
import { AppLayout } from "@web/component/AppLayout";
import { AuthView } from "@web/view/auth/authView";
import { OnboardingView } from "@web/view/onboarding/OnboardingView";
import { VerifyEmailView } from "@web/view/auth/VerifyEmailView";
import { ResetPasswordView } from "@web/view/auth/ResetPasswordView";
import { BrowseView } from "@web/view/browse/BrowseView";
import { SearchView } from "@web/view/search/SearchView";
import { ChatView } from "@web/view/chat/ChatView";
import { NotificationsView } from "@web/view/notifications/NotificationsView";
import { ProfileView } from "@web/view/profile/ProfileView";
import { EditProfileView } from "@web/view/profile/EditProfileView";
import { UserProfileView } from "@web/view/profile/UserProfileView";
import { LikesView } from "@web/view/profile/LikesView";
import { VisitsView } from "@web/view/profile/VisitsView";

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
        <Route path={WebRoutes.VerifyEmail} element={<VerifyEmailView />} />
        <Route path={WebRoutes.ResetPassword} element={<ResetPasswordView />} />

        {!user ? (
          <Route path="*" element={<AuthView />} />
        ) : !user.onboarded ? (
          <Route path="*" element={<OnboardingView />} />
        ) : (
          <Route element={<AppLayout />}>
            <Route path={WebRoutes.Browse} element={<BrowseView />} />
            <Route path={WebRoutes.Search} element={<SearchView />} />
            <Route path={WebRoutes.Chat} element={<ChatView />} />
            <Route path={WebRoutes.Notifications} element={<NotificationsView />} />
            <Route path={WebRoutes.Profile} element={<ProfileView />} />
            <Route path={WebRoutes.EditProfile} element={<EditProfileView />} />
            <Route path={WebRoutes.User} element={<UserProfileView />} />
            <Route path={WebRoutes.Likes} element={<LikesView />} />
            <Route path={WebRoutes.Visits} element={<VisitsView />} />
            <Route path="*" element={<Navigate to={WebRoutes.Browse} replace />} />
          </Route>
        )}
      </RouterRoutes>
    </BrowserRouter>
  );
}
