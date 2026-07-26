import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Upload, User } from "lucide-react";
import { useAuthContext } from "../../auth/authContext";
import { getProfile, uploadProfilePic } from "../service/game.api";
import "../styles/ProfilePage.scss";

export default function ProfilePage() {
  const { setUser } = useAuthContext();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [picError, setPicError] = useState("");

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

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleProfilePicChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setPicError("");

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPicError("Please choose an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setPicError("Please choose an image under 4MB.");
      return;
    }

    setUploadingPic(true);
    try {
      const imageData = await readFileAsDataUrl(file);
      const data = await uploadProfilePic(imageData);
      if (!data.success) {
        throw new Error(data.message || "Profile picture upload failed");
      }

      setProfile((current) => ({
        ...current,
        profilePic: data.profilePic
      }));
      setUser((current) => current ? { ...current, profilePic: data.profilePic } : current);
    } catch (error) {
      setPicError(error.response?.data?.message || error.message || "Profile picture upload failed.");
    } finally {
      setUploadingPic(false);
    }
  };

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
            {profile?.profilePic ? (
              <img className="profile-avatar-img" src={profile.profilePic} alt={profile?.username || "Profile"} />
            ) : (
              <User size={48} />
            )}
          </div>
          <label className={`profile-pic-upload ${uploadingPic ? "uploading" : ""}`}>
            {uploadingPic ? <Loader2 size={18} className="spin-icon" /> : <Camera size={18} />}
            <span>{uploadingPic ? "Uploading..." : "Change Picture"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              disabled={uploadingPic}
            />
          </label>
          {picError && <p className="profile-pic-error">{picError}</p>}
          <h1 className="profile-name">{profile?.username || "Laughify Player"}</h1>
          <p className="profile-email">{profile?.email || "Ready to beat the next level"}</p>
          <p className="profile-tagline">We bring smile on your faces</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-value">{profile?.highestLevel || 1}</span>
              <span className="profile-label">Highest Level</span>
            </div>
            <div className="profile-stat">
              <span className="profile-value">
                <Upload size={34} />
              </span>
              <span className="profile-label">Custom Avatar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
