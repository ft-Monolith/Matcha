/**
 * Erreur HTTP typée.
 *
 * Un service lève `throw new HttpError(404, "Profil introuvable")`, et le middleware
 * d'erreurs final la transforme en réponse JSON propre.
 *
 * Point clé du découpage : cette classe n'importe PAS express. Les services peuvent
 * donc l'utiliser tout en restant testables sans serveur HTTP.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
