import { Navigate } from "react-router-dom";
import { WebRoutes } from "@web/routes";

export function EditProfileView() {
  return <Navigate to={WebRoutes.Profile} replace />;
}
