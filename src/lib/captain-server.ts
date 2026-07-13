import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingColumnError } from "@/lib/supabase/schema-fallback";

export async function assertCaptainToken(
  supabase: SupabaseClient,
  teamId: string,
  captainToken: string | null | undefined
) {
  if (!captainToken?.trim()) {
    throw new Error(
      "Captain access required. This device is view-only — use the team captain iPad to order and submit."
    );
  }

  const { data: team, error } = await supabase
    .from("teams")
    .select("captain_token")
    .eq("id", teamId)
    .single();

  if (error) {
    if (isMissingColumnError(error.message, "captain_token")) return;
    throw new Error(error.message);
  }

  if (!team?.captain_token) return;

  if (team.captain_token !== captainToken.trim()) {
    throw new Error(
      "Invalid captain credentials. Enter the captain PIN on this device, or ask your teacher to reset it."
    );
  }
}
