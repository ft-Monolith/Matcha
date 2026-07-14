export class HealthDTO {
  status!: "ok" | "degraded";
  db!: "up" | "down";
  uptime!: number;
}
