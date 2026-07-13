/** Build the read-only viewer URL for teammates on their own iPads. */
export function buildViewerUrl(teamId: string, baseUrl?: string): string {
  const base =
    baseUrl?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "";
  return `${base}/play/${teamId}/view`;
}
