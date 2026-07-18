import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, User } from "lucide-react";
import { useAuthContext } from "../../auth/authContext";
import { useGameContext } from "../context/GameContext";
import "../styles/ProfilePage.scss";

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { highestLevel, currentLevel, gamesPlayed, winRate, achievements, wins } = useGameContext();

  const derivedAchievements = [
    highestLevel >= 2 ? "Level Breaker" : null,
    wins >= 1 ? "First Victory" : null,
    winRate >= 70 && gamesPlayed >= 3 ? "Sharp Face" : null,
    gamesPlayed >= 5 ? "Committed Player" : null,
  ].filter(Boolean);

  const displayAchievements = achievements.length ? achievements : derivedAchievements;

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-topbar">
          <Link to="/" className="profile-back">
            <ArrowLeft size={20} />
            Home
          </Link>
          <Link to="/leaderboard" className="profile-link">Leaderboard</Link>
        </div>

        <div className="profile-card glass-card">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <h1 className="profile-name">{user?.username || "Laughify Player"}</h1>
          <p className="profile-email">{user?.email || "Ready to beat the next level"}</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-value">{highestLevel}</span>
              <span className="profile-label">Highest Level</span>
            </div>
            <div className="profile-stat">
              <span className="profile-value">{currentLevel}</span>
              <span className="profile-label">Current Level</span>
            </div>
            <div className="profile-stat">
              <span className="profile-value">{gamesPlayed}</span>
              <span className="profile-label">Games Played</span>
            </div>
            <div className="profile-stat">
              <span className="profile-value">{winRate}%</span>
              <span className="profile-label">Win Rate</span>
            </div>
          </div>

          <div className="achievement-section">
            <h2 className="achievement-title">Achievements</h2>
            <div className="achievement-grid">
              {displayAchievements.length ? (
                displayAchievements.map((item) => (
                  <div key={item} className="achievement-pill">
                    <Trophy size={16} />
                    {item}
                  </div>
                ))
              ) : (
                <div className="achievement-empty">Play more levels to unlock achievements.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
