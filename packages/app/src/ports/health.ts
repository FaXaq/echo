export interface HealthCheckPort {
  check: () => Promise<boolean>;
}
