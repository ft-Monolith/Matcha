import type { NextFunction, Request, RequestHandler, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate as classValidate } from "class-validator";
import { HttpError } from "../http-error";

type ClassConstructor<T> = new () => T;

/**
 * Middleware de VALIDATION — c'est LUI qui fait vivre les décorateurs des DTOs.
 *
 * Sans ce middleware, `@IsEmail`, `@IsStrongPassword`… ne s'exécutent jamais : ce ne
 * sont que des métadonnées. Le middleware les déclenche à la réception d'une requête.
 *
 * Étapes :
 *   1. `plainToInstance` : transforme le body JSON brut en instance du DTO.
 *   2. `validate` : applique tous les décorateurs → liste d'erreurs.
 *   3. si erreurs → 400 avec les messages ; sinon on remplace req.body par l'instance
 *      validée et on passe au handler.
 *
 * Usage :  router.post("/register", validate(RegisterDTO), asyncHandler(...))
 */
export function validate<T extends object>(Dto: ClassConstructor<T>): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const instance = plainToInstance(Dto, req.body ?? {});

    const errors = await classValidate(instance, {
      whitelist: true, 
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
      next(new HttpError(400, "Validation failed", messages));
      return;
    }

    req.body = instance;
    next();
  };
}
