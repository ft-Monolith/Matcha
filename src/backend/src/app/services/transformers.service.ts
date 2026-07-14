import type { HealthDTO } from "@common/dto/health.dto";

/**
 * TRANSFORMERS — la frontière de sortie de l'API.
 *
 * RÈGLE D'OR : rien ne quitte le backend sans passer par ici. Une entity (ligne SQL
 * brute) n'est JAMAIS renvoyée telle quelle — sinon un `password_hash` ou un `email`
 * privé finirait dans la réponse JSON.
 *
 * Convention : UNE méthode `xToDTO(entity): XDTO` par cas, avec un destructuring
 * EXPLICITE → objet littéral. C'est le destructuring qui fait la sécurité : un champ
 * non listé ne peut pas sortir, même si on l'ajoute plus tard en base.
 *
 * Instancié UNE fois dans main.ts (composition root) et injecté aux services.
 */

/** État interne, non exposé. C'est la « matière première » du DTO. */

// TODO: ca faudrait le bouger ailleur voir l infra
export interface HealthSnapshot {
  dbUp: boolean;
  uptimeSeconds: number;
}

export class TransformersService {
  healthToDTO(snapshot: HealthSnapshot): HealthDTO {
    const { dbUp, uptimeSeconds } = snapshot;

    return {
      status: dbUp ? "ok" : "degraded",
      db: dbUp ? "up" : "down",
      uptime: Math.floor(uptimeSeconds),
    };
  }

  // À
}
