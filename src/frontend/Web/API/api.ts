import { APIHealth } from "./methods/api.health";

/**
 point d'entrée unique du front vers le backend.
 *
 * C'est la « map » de tous les domaines. Un composant importe `API`, et rien d'autre :
 *
 *   API.health.getHealth()
 *   API.auth.login(dto)         ← plus tard
 *   API.profile.get(username)   ← plus tard
 *
 * Intérêt : AUCUN composant ne fait de `fetch()` en direct. Le jour où il faut ajouter
 * un refresh de token sur 401, ou un header global, ça se change à UN seul endroit.
 *
 * (Le `_API` de Moggo portait en plus des `setBrand`/`setOrg` pour le multi-tenant :
 *  inutile ici, Matcha n'a qu'un seul type d'utilisateur.)
 */
class ApiRoot {
  readonly health = new APIHealth();

  // ajouter une ligne par domaine 
  // par exemple : readonly auth = new APIAuth(); et les method seront dans le fichier auth de methods
}

export const API = new ApiRoot();
