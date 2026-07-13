import { randomInt, randomUUID } from "crypto";

export function generateCaptainPin(): string {
  return String(randomInt(1000, 10000));
}

export function generateCaptainToken(): string {
  return randomUUID();
}
