import { APIHealth } from "./methods/api.health";
import { APIAuth } from "./methods/api.auth";


class ApiRoot {
  readonly health = new APIHealth();
  readonly auth = new APIAuth();


}

export const API = new ApiRoot();
