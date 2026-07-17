import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import FaceExpression from "../../components/FaceExpression";
import { useGameContext } from "../context/GameContext";
import { useAuthContext } from "../../auth/authContext";
import { getVideoByLevel, uploadUserPhoto, updateHighestLevel } from "../service/game.api";
import "../styles/GamePage.scss";

export default function GamePage() {
  const navigate = useNavigate();
  const { currentLevel, unlockNextLevel, setIsGameActive } = useGameContext();
  const { user } = useAuthContext();

  const [videoUrl, setVideoUrl] = useState("");
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [detectionState, setDetectionState] = useState({
    smileIntensity: 0,
    eyesOpen: { isOpen: true },
    eyesOnScreen: { isOnScreen: true },
    faceDetected: false,
  });

  const [gameState, setGameState] = useState({
    isPlaying: false,
  });

  const videoRef = useRef(null);
  const eyesClosedTimerRef = useRef(null);
  const faceAwayTimerRef = useRef(null);
  const hasCapturedPhoto = useRef(false);

  // Refs for animations
  const levelRef = useRef(null);
  const faceCircleRef = useRef(null);
  const startScreenRef = useRef(null);
  const smileIndicatorRef = useRef(null);

  // Fetch video for current level
  useEffect(() => {
    async function fetchVideo() {
      setIsLoadingVideo(true);
      try {
        const data = await getVideoByLevel(currentLevel);
        setVideoUrl(data.videoUrl);
      } catch (error) {
        console.error("Failed to fetch video:", error);
      } finally {
        setIsLoadingVideo(false);
      }
    }
    fetchVideo();
  }, [currentLevel]);

  // Entrance animations
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      levelRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    ).fromTo(
      faceCircleRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
      "-=0.4"
    );
  }, []);

  // Capture and upload photo when user loses
  const captureAndUploadPhoto = useCallback(async () => {
    try {
      const canvas = document.createElement('canvas');
      const videoElement = document.querySelector('.face-circle-inner video');
      if (videoElement && videoElement.readyState === 4) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        await uploadUserPhoto(currentLevel, imageData, user?._id);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
    }
  }, [currentLevel, user]);

  // Handle loss
  const handleLose = useCallback(async (reason) => {
    if (hasCapturedPhoto.current) return;
    hasCapturedPhoto.current = true;

    setGameState({ isPlaying: false });
    setIsGameActive(false);
    
    // Stop video
    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Capture photo
    await captureAndUploadPhoto();

    // Navigate to lose page
    navigate("/lose", { state: { reason } });
  }, [setIsGameActive, captureAndUploadPhoto, navigate]);

  // Handle win (video ended)
  const handleVideoEnd = useCallback(async () => {
    if (gameState.isPlaying) {
      setGameState({ isPlaying: false });
      setIsGameActive(false);
      
      // Update highest level if user is logged in
      if (user) {
        try {
          await updateHighestLevel(currentLevel + 1);
        } catch (error) {
          console.error("Failed to update highest level:", error);
        }
      }
      
      unlockNextLevel();
      navigate("/level-complete");
    }
  }, [gameState.isPlaying, setIsGameActive, unlockNextLevel, navigate, currentLevel, user]);

  // Update detection state
  const updateDetectionState = useCallback((state) => {
    setDetectionState(state);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    hasCapturedPhoto.current = false;
    setGameState({ isPlaying: true });
    setIsGameActive(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }

    // GSAP animations for start
    gsap.to(startScreenRef.current, {
      opacity: 0,
      y: -50,
      duration: 0.5,
      ease: "power3.in",
      onComplete: () => gsap.set(startScreenRef.current, { display: "none" })
    });

    gsap.fromTo(
      smileIndicatorRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
    );
  }, [setIsGameActive]);

  // Monitor loss conditions
  useEffect(() => {
    if (!gameState.isPlaying) {
      if (eyesClosedTimerRef.current) clearTimeout(eyesClosedTimerRef.current);
      if (faceAwayTimerRef.current) clearTimeout(faceAwayTimerRef.current);
      return;
    }

    // Condition 1: Smile > 20% - highest priority, immediate loss
    if (detectionState.smileIntensity > 20) {
      handleLose("smile");
      return;
    }

    // Condition 2: Eyes closed > 2s - next priority
    if (!detectionState.eyesOpen?.isOpen) {
      if (!eyesClosedTimerRef.current) {
        eyesClosedTimerRef.current = setTimeout(() => {
          handleLose("eyes-closed");
        }, 2000);
      }
    } else {
      if (eyesClosedTimerRef.current) {
        clearTimeout(eyesClosedTimerRef.current);
        eyesClosedTimerRef.current = null;
      }
    }

    // Condition 3: Face not detected > 2s - only if no other condition
    if (!detectionState.faceDetected) {
      if (!faceAwayTimerRef.current) {
        faceAwayTimerRef.current = setTimeout(() => {
          handleLose("face-away");
        }, 2000);
      }
    } else {
      if (faceAwayTimerRef.current) {
        clearTimeout(faceAwayTimerRef.current);
        faceAwayTimerRef.current = null;
      }
    }
  }, [detectionState, gameState.isPlaying, handleLose]);

  return (
    <div className="game-page">
      {/* Back button */}
      <button 
        className="back-btn btn-secondary"
        onClick={() => navigate("/")}
      >
        ← Back
      </button>

      {/* Level indicator */}
      <div ref={levelRef} className="level-indicator glass-card">
        <div className="level-number">Level {currentLevel}</div>
        <div className="tagline" style={{ fontSize: "14px", marginTop: "6px" }}>
          Keep a Straight Face or Lose It All
        </div>
      </div>

      {/* Top-right face circle */}
      <div ref={faceCircleRef} className="face-circle glass-card">
        <FaceExpression 
          className="face-circle-inner"
          onDetectionUpdate={updateDetectionState}
        />
      </div>

      {/* Full-screen video */}
      {isLoadingVideo ? (
        <div className="loading-screen">
          <div className="loader-spinner" />
          <p className="loader-text">Loading video...</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="fullscreen-video"
          src={videoUrl}
          onEnded={handleVideoEnd}
          playsInline
        />
      )}

      {/* Start screen overlay */}
      {!gameState.isPlaying && !isLoadingVideo && (
        <div ref={startScreenRef} className="start-screen-overlay">
          <div className="start-screen-content glass-card">
            <div className="level-preview">Level {currentLevel}</div>
            <div className="rules">
              <h3 className="rules-title">How to Win:</h3>
              <ul className="rules-list">
                <li>• No smiles or laughter</li>
                <li>• Keep your eyes open</li>
                <li>• Stay in the camera's view</li>
              </ul>
            </div>
            <button className="start-game-btn btn-primary" onClick={startGame}>
              🚀 Start Level
            </button>
          </div>
        </div>
      )}

      {/* Smile indicator */}
      {gameState.isPlaying && (
        <div ref={smileIndicatorRef} className="smile-indicator glass-card">
          <div className="smile-label">Smile Meter</div>
          <div className="smile-bar-container">
            <div 
              className={`smile-bar ${detectionState.smileIntensity > 20 ? 'danger' : ''}`}
              style={{ width: `${detectionState.smileIntensity}%` }}
            />
          </div>
          <div className="smile-value">{Math.round(detectionState.smileIntensity)}%</div>
        </div>
      )}
    </div>
  );
}
