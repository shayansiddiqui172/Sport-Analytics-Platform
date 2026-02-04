"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Loader2 } from "lucide-react";
import { Input, TeamLogo, PlayerHeadshot } from "@/components/ui";
import { usePlayerSearch, useTeams } from "@/hooks/useNBAData";
import { useNBAPlayerId } from "@/hooks/useNBAStats";
import { cn } from "@/lib/utils/cn";

interface SearchBarProps {
  className?: string;
  onClose?: () => void;
}

export function SearchBar({ className, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: playersData, isLoading: playersLoading } = usePlayerSearch(query);
  const { data: teamsData } = useTeams();

  const players = playersData?.data || [];
  const allTeams = teamsData?.data || [];

  // PERF: Memoize teams filtering to prevent recomputation on every render
  const teams = useMemo(() => {
    if (query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return allTeams.filter(
      (team) =>
        team.full_name.toLowerCase().includes(lowerQuery) ||
        team.city.toLowerCase().includes(lowerQuery) ||
        team.name.toLowerCase().includes(lowerQuery) ||
        team.abbreviation.toLowerCase().includes(lowerQuery)
    );
  }, [query, allTeams]);

  // PERF: Memoize results array to prevent creating new objects on every render
  const results = useMemo(() => [
    ...players.map((p) => ({ type: "player" as const, data: p })),
    ...teams.map((t) => ({ type: "team" as const, data: t })),
  ], [players, teams]);

  const hasResults = results.length > 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasResults) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowResults(false);
      setQuery("");
    }
  };

  const handleSelect = (result: (typeof results)[0]) => {
    if (result.type === "player") {
      router.push(`/players/${result.data.id}`);
    } else {
      router.push(`/teams/${result.data.id}`);
    }
    setQuery("");
    setShowResults(false);
    setSelectedIndex(0);
    onClose?.();
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowResults(true);
    setSelectedIndex(0);
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <Input
        placeholder="Search players, teams..."
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        onKeyDown={handleKeyDown}
        leftIcon={
          playersLoading && query.length >= 2 ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )
        }
        className="h-9 text-sm"
      />

      {showResults && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {hasResults ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={
                    result.type === "player"
                      ? `player-${result.data.id}`
                      : `team-${result.data.id}`
                  }
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors flex items-center gap-3",
                    index === selectedIndex && "bg-surface-hover"
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {result.type === "player" ? (
                    <PlayerSearchResult player={result.data} />
                  ) : (
                    <>
                      <TeamLogo
                        teamId={result.data.id}
                        teamName={`${result.data.city} ${result.data.name}`}
                        abbreviation={result.data.abbreviation}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {result.data.city} {result.data.name}
                        </p>
                        <p className="text-sm text-text-secondary truncate">
                          {result.data.conference}ern Conference ·{" "}
                          {result.data.division}
                        </p>
                      </div>
                      <Users className="w-4 h-4 text-text-muted shrink-0" />
                    </>
                  )}
                </button>
              ))}
            </div>
          ) : playersLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Searching...</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Search className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">
                No results for &quot;{query}&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerSearchResult({ player }: { player: any }) {
  const { data: nbaPlayerId } = useNBAPlayerId(
    player.first_name || "",
    player.last_name || ""
  );

  return (
    <>
      <PlayerHeadshot
        nbaPlayerId={nbaPlayerId}
        firstName={player.first_name}
        lastName={player.last_name}
        teamAbbreviation={player.team?.abbreviation}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {player.first_name} {player.last_name}
        </p>
        <p className="text-sm text-text-secondary truncate">
          {player.team?.full_name || "Free Agent"}
          {player.position && ` · ${player.position}`}
        </p>
      </div>
    </>
  );
}
