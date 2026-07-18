import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ArrowLeft, Smile } from "lucide-react";
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
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Entrance animations (when game page first loads)
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      ".back-btn",
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
    ).fromTo(
      levelRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.6"
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
    if (hasCapturedPhoto.current || isTransitioning) return;
    hasCapturedPhoto.current = true;
    setIsTransitioning(true);
    setGameState({ isPlaying: false });
    setIsGameActive(false);

    // Stop video
    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Capture photo (don't wait too long for it)
    try {
      await Promise.race([
        captureAndUploadPhoto(),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
    } catch (err) {
      console.error("Error uploading photo, continuing anyway", err);
    }

    // Navigate immediately
    navigate("/lose", { state: { reason } });
  }, [setIsGameActive, captureAndUploadPhoto, navigate, isTransitioning]);

  // Handle win (video ended)
  const handleVideoEnd = useCallback(async () => {
    if (gameState.isPlaying && !isTransitioning) {
      setIsTransitioning(true);
      setGameState({ isPlaying: false });
      setIsGameActive(false);

      // Update highest level if user is logged in
      if (user) {
        try {
          await Promise.race([
            updateHighestLevel(currentLevel + 1),
            new Promise(resolve => setTimeout(resolve, 1000))
          ]);
        } catch (error) {
          console.error("Failed to update highest level, continuing anyway:", error);
        }
      }

      unlockNextLevel();

      // Navigate immediately
      navigate("/level-complete");
    }
  }, [gameState.isPlaying, setIsGameActive, unlockNextLevel, navigate, currentLevel, user, isTransitioning]);

  // Update detection state
  const updateDetectionState = useCallback((state) => {
    setDetectionState(state);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    hasCapturedPhoto.current = false;
    setIsTransitioning(false);
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
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => gsap.set(startScreenRef.current, { display: "none" })
    });

    // Hide UI elements (back button, level indicator) when game starts
    gsap.to([levelRef.current, ".back-btn"], {
      opacity: 0,
      y: -30,
      duration: 0.4,
      ease: "power3.out"
    });

    // Show smile indicator (since we want it visible during gameplay)
    gsap.fromTo(
      smileIndicatorRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
    );
  }, [setIsGameActive]);

  // Monitor loss conditions
  useEffect(() => {
    console.log("Detection State: ", detectionState); // Debug log!
    if (!gameState.isPlaying) {
      if (eyesClosedTimerRef.current) clearTimeout(eyesClosedTimerRef.current);
      if (faceAwayTimerRef.current) clearTimeout(faceAwayTimerRef.current);
      return;
    }

    // Condition 1: Smile > 20% - highest priority, immediate loss
    if (detectionState.smileIntensity > 20) {
      console.log("Losing: smile too big (", detectionState.smileIntensity, "%)");
      handleLose("smile");
      return;
    }

    // Condition 2: Eyes closed > 2s - next priority
    if (!detectionState.eyesOpen?.isOpen) {
      if (!eyesClosedTimerRef.current) {
        console.log("Starting eyes closed timer (2s)");
        eyesClosedTimerRef.current = setTimeout(() => {
          console.log("Losing: eyes closed too long");
          handleLose("eyes-closed");
        }, 2000);
      }
    } else {
      if (eyesClosedTimerRef.current) {
        console.log("Clearing eyes closed timer");
        clearTimeout(eyesClosedTimerRef.current);
        eyesClosedTimerRef.current = null;
      }
    }

    // Condition 3: Face not detected OR eyes not on screen > 1.5s - solid logic
    const isFaceAwayOrOffScreen = !detectionState.faceDetected || !detectionState.eyesOnScreen?.isOnScreen;
    if (isFaceAwayOrOffScreen) {
      if (!faceAwayTimerRef.current) {
        console.log("Starting face away/look away timer (1.5s)");
        faceAwayTimerRef.current = setTimeout(() => {
          console.log("Losing: face away/look away too long");
          handleLose("face-away");
        }, 1500);
      }
    } else {
      if (faceAwayTimerRef.current) {
        console.log("Clearing face away/look away timer");
        clearTimeout(faceAwayTimerRef.current);
        faceAwayTimerRef.current = null;
      }
    }
  }, [detectionState, gameState.isPlaying, handleLose]);

  return (
    <div className="game-page">
      {/* Back button */}
      <button 
        className="back-btn"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={24} />
      </button>

      {/* Level indicator */}
      <div ref={levelRef} className="level-indicator glass-card">
        <div className="level-number">Level {currentLevel}</div>
        <div className="tagline">
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
      {!gameState.isPlaying && !isLoadingVideo && !isTransitioning && (
        <div ref={startScreenRef} className="start-screen-overlay">
          <div className="start-screen-content glass-card">
            <div className="level-preview">Level {currentLevel}</div>
            <div className="rules">
              <h3 className="rules-title">How to Win:</h3>
              <ul className="rules-list">
                <li>No smiles or laughter</li>
                <li>Keep your eyes open</li>
                <li>Stay in the camera's view</li>
              </ul>
            </div>
            <button className="start-game-btn btn-primary" onClick={startGame}>
              Start Level
            </button>
          </div>
        </div>
      )}

      {/* Smile indicator */}
      {gameState.isPlaying && (
        <div ref={smileIndicatorRef} className="smile-indicator glass-card">
          <div className="smile-label">
            <Smile size={20} />
            Smile Meter
          </div>
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
