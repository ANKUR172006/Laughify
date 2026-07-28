import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthContext } from "../../auth/authContext";
import { getLeaderboard } from "../service/game.api";
import "../styles/LeaderboardPage.scss";

const MotionDiv = motion.div;

export default function LeaderboardPage() {
  const { user } = useAuthContext();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getLeaderboard();
      setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Could not load the leaderboard right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchLeaderboard, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLeaderboard]);

  const badgeForRank = (rank) => {
    if (rank === 1) return <Trophy size={20} />;
    if (rank === 2) return <Trophy size={18} />;
    if (rank === 3) return <Trophy size={16} />;
    return <span className="rank-number">#{rank}</span>;
  };

  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.12,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 24 },
    },
  };

  if (loading) {
    return (
      <MotionDiv
        className="leaderboard-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="loading-screen">Loading...</div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      className="leaderboard-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="leaderboard-shell">
        <div className="leaderboard-topbar">
          <Link to="/" className="leaderboard-back">
            <ArrowLeft size={20} />
            Home
          </Link>
          <div className="leaderboard-meta">We bring smile on your faces</div>
        </div>

        <MotionDiv
          className="leaderboard-card glass-card"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        >
          <h1 className="leaderboard-title">Top Players</h1>
          <MotionDiv
            className="leaderboard-list"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {error ? (
              <div className="leaderboard-state">
                <p>{error}</p>
                <button onClick={fetchLeaderboard}>Try Again</button>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="leaderboard-state">
                <p>No players on the leaderboard yet.</p>
              </div>
            ) : (
              leaderboard.map((player, index) => (
                <MotionDiv
                  key={player._id || player.username || index}
                  className={`leaderboard-row ${index + 1 <= 3 ? `top-rank rank-${index + 1}` : ""} ${player._id === user?._id || player.username === user?.username ? "current-user" : ""}`}
                  variants={rowVariants}
                  whileHover={{ y: -5, rotate: 0, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  <div className="rank-cell">{badgeForRank(index + 1)}</div>
                  <div className="avatar-cell">
                    {player.profilePic ? (
                      <img src={player.profilePic} alt={player.username || "Player"} />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="player-cell">
                    <span className="player-name">{player.username || "Anonymous Player"}</span>
                    <span className="player-subtitle">Rank #{index + 1}</span>
                  </div>
                  <div className="level-cell">Level {player.highestLevel || 1}</div>
                </MotionDiv>
              ))
            )}
          </MotionDiv>
        </MotionDiv>
      </div>
    </MotionDiv>
  );
}
