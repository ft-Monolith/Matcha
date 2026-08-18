import { API } from "@web/API/api";
import { ProfileList } from "@web/component/ProfileList";

export function SearchView() {
  return (
    <ProfileList
      fetchPage={(limit, offset) => API.profiles.list(limit, offset)}
      emptyMessage="No profiles yet."
    />
  );
}
