import { Router } from "express";
import type { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";

export function ControllerNotificationsModule(service: NotificationService): Router {
  const controller = new NotificationController(service);

  const router = Router();
  controller.register(router);
  return router;
}
