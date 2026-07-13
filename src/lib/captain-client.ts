const TOKEN_KEY = (teamId: string) => `captain-token-${teamId}`;

export function storeCaptainToken(teamId: string, token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY(teamId), token);
}

export function getCaptainToken(teamId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY(teamId));
}

export function clearCaptainToken(teamId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY(teamId));
}
