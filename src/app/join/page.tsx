import { JoinGameForm } from "./join-game-form";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const initialCode = code?.trim().toUpperCase().slice(0, 6) ?? "";

  return <JoinGameForm initialCode={initialCode} />;
}
