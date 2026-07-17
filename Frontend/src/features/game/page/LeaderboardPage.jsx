import React from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../auth/authContext";
import { useGameContext } from "../context/GameContext";
import "../styles/LeaderboardPage.scss";

export default function LeaderboardPage() {
  const { user } = useAuthContext();
  const { highestLevel, winRate } = useGameContext();

  const leaderboard = [
    { rank: 1, username: "PokerQueen", avatar: "P", highestLevel: 12 },
    { rank: 2, username: "StoneFace", avatar: "S", highestLevel: 10 },
    { rank: 3, username: "NoSmilePro", avatar: "N", highestLevel: 9 },
    { rank: 4, username: user?.username || "You", avatar: user?.username?.slice(0, 1)?.toUpperCase() || "Y", highestLevel },
    { rank: 5, username: "GiggleGuard", avatar: "G", highestLevel: 7 },
  ].sort((a, b) => b.highestLevel - a.highestLevel).map((item, index) => ({ ...item, rank: index + 1 }));

  const badgeForRank = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "#";
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-shell">
        <div className="leaderboard-topbar">
          <Link to="/" className="leaderboard-back">← Home</Link>
          <div className="leaderboard-meta">Your Win Rate: {winRate}%</div>
        </div>

        <div className="leaderboard-card">
          <h1 className="leaderboard-title">Top 5 Players</h1>
          <div className="leaderboard-list">
            {leaderboard.map((player) => (
              <div
                key={`${player.username}-${player.rank}`}
                className={`leaderboard-row ${player.rank <= 3 ? "top-rank" : ""} ${player.username === (user?.username || "You") ? "current-user" : ""}`}
              >
                <div className="rank-cell">{badgeForRank(player.rank)}</div>
                <div className="avatar-cell">{player.avatar}</div>
                <div className="player-cell">
                  <span className="player-name">{player.username}</span>
                  <span className="player-subtitle">Rank #{player.rank}</span>
                </div>
                <div className="level-cell">Level {player.highestLevel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
