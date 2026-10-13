"use client";

import { useMemo, useState } from "react";
import {
  buildStandings,
  type LiveRanking,
  type MatchResult,
  type StandingRow,
} from "@/lib/standings";

const EMPTY_MESSAGES: Record<string, string> = {
  rcml: "No RCML standings have been posted yet.",
  rfcl: "Season not started.",
  rbsl: "Season not started.",
};

export default function RankingsTable({
  rows,
  results,
}: {
  rows: LiveRanking[];
  results: MatchResult[];
}) {
  const [filter, setFilter] = useState("rcml");

  const standings: StandingRow[] = useMemo(
    () => buildStandings(rows, filter, results),
    [rows, results, filter]
  );

  const hasTies = standings.some((s) => s.tied);

  return (
    <>
      <div className="filter-bar">
        <button
          className="filter-chip"
          aria-pressed={filter === "rcml"}
          onClick={() => setFilter("rcml")}
        >
          RCML · Season 4
        </button>
        <button
          className="filter-chip"
          aria-pressed={filter === "rfcl"}
          onClick={() => setFilter("rfcl")}
        >
          RFCL
        </button>
        <button
          className="filter-chip"
          aria-pressed={filter === "rbsl"}
          onClick={() => setFilter("rbsl")}
        >
          RBSL
        </button>
      </div>

      <div className="table-wrap">
        <table className="rank-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>Tag</th>
              <th>W</th>
              <th>L</th>
              <th>Win %</th>
            </tr>
          </thead>
          <tbody>
            {standings.length === 0 ? (
              <tr className="rank-row">
                <td className="pos">—</td>
                <td
                  className="team-name"
                  colSpan={5}
                  style={{ color: "var(--steel)" }}
                >
                  {EMPTY_MESSAGES[filter] ?? "No standings yet."}
                </td>
              </tr>
            ) : (
              standings.map((row) => (
                <tr key={`${filter}-${row.team}`} className="rank-row">
                  <td className="pos">{row.pos}</td>
                  <td className="team-name">
                    {row.team}
                    {row.tied ? (
                      <sup
                        title="Tied on win % — ordered by head-to-head, then wins"
                        style={{ marginLeft: "0.25rem", color: "var(--amber)" }}
                      >
                        †
                      </sup>
                    ) : null}
                  </td>
                  <td>{row.tag}</td>
                  <td>{row.wins}</td>
                  <td>{row.losses}</td>
                  <td>{row.pct}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p
        style={{
          marginTop: "1rem",
          fontFamily: "var(--f-mono)",
          fontSize: "0.78rem",
          color: "var(--steel)",
        }}
        id="rankings-status"
      >
        {standings.length === 0
          ? filter === "rcml"
            ? "Standings appear here once results are reported."
            : `${filter.toUpperCase()} standings open once Season 1 begins.`
          : hasTies
            ? "† Tied on win % — ordered by head-to-head result, then total wins."
            : "Standings update after every reported match."}
      </p>
    </>
  );
}
