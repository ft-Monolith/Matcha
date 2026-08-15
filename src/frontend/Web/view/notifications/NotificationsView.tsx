import { toast } from "sonner";
import { Button } from "@shadcn/ui/button";

export function NotificationsView() {
  function makeToast() {
    toast("New notification", {
      description: "Someone liked your profile.",
    });
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <Button onClick={makeToast}>Make toast</Button>
    </div>
  );
}
