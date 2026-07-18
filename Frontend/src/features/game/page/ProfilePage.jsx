import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Smile, User } from "lucide-react";
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
            {profile?.smilePhotos?.length > 0 ? (
              <img src={profile.smilePhotos[profile.smilePhotos.length -1].url} alt="Profile" className="profile-avatar-img" />
            ) : (
              <User size={48} />
            )}
          </div>
          <h1 className="profile-name">{profile?.username || "Laughify Player"}</h1>
          <p className="profile-email">{profile?.email || "Ready to beat the next level"}</p>
          <p className="profile-tagline">We bring smile on your faces</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-value">{profile?.highestLevel || 1}</span>
              <span className="profile-label">Highest Level</span>
            </div>
            <div className="profile-stat">
              <span className="profile-value">{profile?.smilePhotos?.length || 0}</span>
              <span className="profile-label">Laugh Captured</span>
            </div>
          </div>

          <div className="smile-photos-section">
            <h2 className="smile-photos-title">
              <Smile size={20} />
              Your Laugh Gallery
            </h2>
            <div className="smile-photos-grid">
              {profile?.smilePhotos?.length > 0 ? (
                profile.smilePhotos.slice().reverse().map((photo, index) => (
                  <div key={index} className="smile-photo-card">
                    <img src={photo.url} alt={`Laugh at level ${photo.level}`} className="smile-photo" />
                    <div className="smile-photo-level">Level {photo.level}</div>
                  </div>
                ))
              ) : (
                <div className="smile-photos-empty">No laughs captured yet! Start playing to capture your smile.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
