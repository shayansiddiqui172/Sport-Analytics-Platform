import { notFound } from "next/navigation";
import GamePageClient from "./GamePageClient";

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  const gameId = Number(id);

  if (!Number.isInteger(gameId) || gameId <= 0) {
    notFound();
  }

  return <GamePageClient gameId={gameId} />;
}
