import { useParams } from "react-router-dom";
import { Placeholder } from "@web/component/Placeholder";

export function UserProfileView() {
  const { id } = useParams();
  return <Placeholder title={`User profile #${id}`} />;
}

