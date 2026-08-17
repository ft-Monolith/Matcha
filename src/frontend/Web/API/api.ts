import { APIHealth } from "./methods/api.health";
import { APIAuth } from "./methods/api.auth";
import { APIProfile } from "./methods/api.profile";


class ApiRoot {
  readonly health = new APIHealth();
  readonly auth = new APIAuth();
  readonly profile = new APIProfile();


}

export const API = new ApiRoot();
