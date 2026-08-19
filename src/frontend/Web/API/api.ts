import { APIHealth } from "./methods/api.health";
import { APIAuth } from "./methods/api.auth";
import { APIProfile } from "./methods/api.profile";
import { APIProfiles } from "./methods/api.profiles";
import { APIMe } from "./methods/api.me";
import { APIChat } from "./methods/api.chat";
import { APINotifications } from "./methods/api.notifications";

class ApiRoot {
  readonly health = new APIHealth();
  readonly auth = new APIAuth();
  readonly profile = new APIProfile();
  readonly profiles = new APIProfiles();
  readonly me = new APIMe();
  readonly chat = new APIChat();
  readonly notifications = new APINotifications();
}

export const API = new ApiRoot();
