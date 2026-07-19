import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { getProfile } from "../service/game.api";
import "../styles/ProfilePage.scss";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile();
        setProfile(data.user);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-screen">Loading...</div>
      </div>
    );
  }

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
          <h1 className="profile-name">{profile?.username || "Laughify Player"}</h1>
          <p className="profile-email">{profile?.email || "Ready to beat the next level"}</p>
          <p className="profile-tagline">We bring smile on your faces</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-value">{profile?.highestLevel || 1}</span>
              <span className="profile-label">Highest Level</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
