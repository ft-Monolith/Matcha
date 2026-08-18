import { API } from "@web/API/api";
import { ProfileList } from "@web/component/ProfileList";

export function LikesView() {
  return (
    <ProfileList
      fetchPage={(limit, offset) => API.me.likers(limit, offset)}
      emptyMessage="No one liked you yet."
    />
  );
}
