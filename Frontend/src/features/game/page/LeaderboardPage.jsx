import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, User } from "lucide-react";
import { useAuthContext } from "../../auth/authContext";
import { getLeaderboard } from "../service/game.api";
import "../styles/LeaderboardPage.scss";

export default function LeaderboardPage() {
  const { user } = useAuthContext();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const badgeForRank = (rank) => {
    if (rank === 1) return <Trophy size={20} />;
    if (rank === 2) return <Trophy size={18} />;
    if (rank === 3) return <Trophy size={16} />;
    return <span className="rank-number">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="loading-screen">Loading...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-shell">
        <div className="leaderboard-topbar">
          <Link to="/" className="leaderboard-back">
            <ArrowLeft size={20} />
            Home
          </Link>
          <div className="leaderboard-meta">We bring smile on your faces</div>
        </div>

        <div className="leaderboard-card glass-card">
          <h1 className="leaderboard-title">Top Players</h1>
          <div className="leaderboard-list">
            {leaderboard.map((player, index) => (
              <div
                key={player._id || index}
                className={`leaderboard-row ${index + 1 <= 3 ? "top-rank" : ""} ${player.username === user?.username ? "current-user" : ""}`}
              >
                <div className="rank-cell">{badgeForRank(index + 1)}</div>
                <div className="avatar-cell">
                  <User size={24} />
                </div>
                <div className="player-cell">
                  <span className="player-name">{player.username}</span>
                  <span className="player-subtitle">Rank #{index + 1}</span>
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
