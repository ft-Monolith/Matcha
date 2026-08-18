import { API } from "@web/API/api";
import { ProfileList } from "@web/component/ProfileList";

export function VisitsView() {
  return (
    <ProfileList
      fetchPage={(limit, offset) => API.me.visits(limit, offset)}
      emptyMessage="No one viewed your profile yet."
    />
  );
}
