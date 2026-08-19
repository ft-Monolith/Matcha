import type { NextFunction, Request, RequestHandler, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate as classValidate } from "class-validator";
import { HttpError } from "../http-error";

type ClassConstructor<T> = new () => T;

export function validate<T extends object>(
  Dto: ClassConstructor<T>,
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const instance = plainToInstance(Dto, req.body ?? {});

    const errors = await classValidate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((e) =>
        Object.values(e.constraints ?? {}),
      );
      next(new HttpError(400, "Validation failed", messages));
      return;
    }

    req.body = instance;
    next();
  };
}
