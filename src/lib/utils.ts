import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/['']/g, "'");
}

export function checkDiagnosis(
  submitted: string,
  accepted: string[],
  alternates: string[]
): boolean {
  const normalized = normalizeAnswer(submitted);
  const allAccepted = [...accepted, ...alternates].map(normalizeAnswer);
  return allAccepted.some(
    (a) => normalized === a || normalized.includes(a) || a.includes(normalized)
  );
}

export function sessionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    waiting: "Waiting for teams",
    active: "Active",
    paused: "Paused",
    ended: "Ended",
  };
  return labels[status] ?? status;
}

export function sessionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    waiting: "bg-amber-100 text-amber-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-orange-100 text-orange-800",
    ended: "bg-gray-100 text-gray-600",
  };
  return colors[status] ?? "bg-gray-100 text-gray-600";
}
