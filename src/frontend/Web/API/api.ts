import { APIHealth } from "./methods/api.health";
import { APIAuth } from "./methods/api.auth";
import { APIProfile } from "./methods/api.profile";
import { APIProfiles } from "./methods/api.profiles";
import { APIMe } from "./methods/api.me";


class ApiRoot {
  readonly health = new APIHealth();
  readonly auth = new APIAuth();
  readonly profile = new APIProfile();
  readonly profiles = new APIProfiles();
  readonly me = new APIMe();


}

export const API = new ApiRoot();
