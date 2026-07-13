"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  generateCaptainPin,
  generateCaptainToken,
} from "@/lib/captain-credentials";

export async function verifyCaptainPin(
  teamId: string,
  pin: string
): Promise<{ captainToken: string }> {
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select("captain_pin, captain_token")
    .eq("id", teamId)
    .single();

  if (error || !team) throw new Error("Team not found");

  if (!team.captain_pin || !team.captain_token) {
    throw new Error("Captain PIN is not set up for this team yet.");
  }

  if (team.captain_pin !== pin.trim()) {
    throw new Error("Incorrect captain PIN.");
  }

  return { captainToken: team.captain_token };
}

export async function resetTeamCaptain(teamId: string, sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: session } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("teacher_id", user.id)
    .single();

  if (!session) throw new Error("Session not found");

  const newPin = generateCaptainPin();
  const newToken = generateCaptainToken();

  const { error } = await supabase
    .from("teams")
    .update({
      captain_pin: newPin,
      captain_token: newToken,
    })
    .eq("id", teamId)
    .eq("session_id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/teacher/sessions/${sessionId}`);
  return { captainPin: newPin };
}
