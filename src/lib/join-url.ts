/** Build the student join URL for a session code (QR + link sharing). */
export function buildJoinUrl(joinCode: string, baseUrl?: string): string {
  const code = joinCode.trim().toUpperCase();
  const base =
    baseUrl?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "";
  return `${base}/join?code=${encodeURIComponent(code)}`;
}
