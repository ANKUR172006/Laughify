import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ArrowLeft, Camera, Lock, Smile, Volume2 } from "lucide-react";
import FaceExpression from "../../components/FaceExpression";
import { useGameContext } from "../context/GameContext";
import { useAuthContext } from "../../auth/authContext";
import { getVideoByLevel, uploadUserPhoto, updateHighestLevel } from "../service/game.api";
import "../styles/GamePage.scss";

const LOSS_RULES = {
  maxSmilePercent: 20,
  smileGraceMs: 250,
  eyesClosedGraceMs: 1000,
  faceMissingGraceMs: 1000,
  lookAwayGraceMs: 1000,
};

export default function GamePage() {
  const navigate = useNavigate();
  const { currentLevel, unlockNextLevel, setIsGameActive } = useGameContext();
  const { user } = useAuthContext();
  const isGuest = !!user?.isGuest;

  const [videoUrl, setVideoUrl] = useState("");
  const [videoLoadNonce, setVideoLoadNonce] = useState(0);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [detectionState, setDetectionState] = useState({
    smileIntensity: 0,
    eyesOpen: { isOpen: true },
    eyesOnScreen: { isOnScreen: true },
    faceDetected: false,
    cameraActive: false,
    cameraError: "",
    loadingModel: true,
  });
  const [volumeConfirmed, setVolumeConfirmed] = useState(false);

  const [gameState, setGameState] = useState({
    isPlaying: false,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const videoRef = useRef(null);
  const faceExpressionRef = useRef(null);
  const smileTimerRef = useRef(null);
  const eyesClosedTimerRef = useRef(null);
  const faceMissingTimerRef = useRef(null);
  const lookAwayTimerRef = useRef(null);
  const hasCapturedPhoto = useRef(false);
  const isTransitioningRef = useRef(false);
  const videoReadyRef = useRef(false);

  const levelRef = useRef(null);
  const faceCircleRef = useRef(null);
  const startScreenRef = useRef(null);
  const smileIndicatorRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const clearLossTimers = useCallback(() => {
    [
      smileTimerRef,
      eyesClosedTimerRef,
      faceMissingTimerRef,
      lookAwayTimerRef,
    ].forEach((timerRef) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    });
  }, []);

  useEffect(() => {
    setVolumeConfirmed(false);

    async function fetchVideo() {
      setIsLoadingVideo(true);
      setIsVideoReady(false);
      videoReadyRef.current = false;
      setVideoError("");
      try {
        const data = await getVideoByLevel(currentLevel);
        setVideoUrl(data.videoUrl || "");
        setVideoLoadNonce((nonce) => nonce + 1);
      } catch (error) {
        console.error("Failed to fetch video:", error);
        setVideoUrl("");
        setVideoError("Video failed to load. Tap retry.");
      } finally {
        setIsLoadingVideo(false);
      }
    }
    fetchVideo();
  }, [currentLevel]);

  useEffect(() => {
    if (!videoUrl) return;
    setIsVideoReady(false);
    videoReadyRef.current = false;
    setVideoError("");
    if (videoRef.current) {
      try {
        videoRef.current.load();
      } catch (_) {
      }
    }

    const timeoutId = setTimeout(() => {
      if (!videoReadyRef.current && !isTransitioningRef.current && !hasCapturedPhoto.current) {
        setVideoError((prev) => prev || "Video taking too long to load. Tap retry.");
      }
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [videoUrl]);

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

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const startCameraRecording = useCallback(() => {
    const stream = faceExpressionRef.current?.getVideoElement?.()?.srcObject;
    if (!stream || typeof MediaRecorder === "undefined") return;

    try {
      const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"]
        .find((type) => MediaRecorder.isTypeSupported(type)) || "";
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data?.size) recordedChunksRef.current.push(event.data);
      };
      recorderRef.current = recorder;
      recorder.start(1000);
    } catch (error) {
      console.error("Error starting camera recording:", error);
    }
  }, []);

  const stopAndUploadCameraRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    try {
      const stopped = new Promise((resolve) => {
        recorder.onstop = resolve;
      });
      recorder.stop();
      await stopped;
      const type = recorder.mimeType || "video/webm";
      const blob = new Blob(recordedChunksRef.current, { type });
      recordedChunksRef.current = [];
      recorderRef.current = null;
      if (!blob.size) return;

      if (!user || user.isGuest) return;

      const videoData = await blobToDataUrl(blob);
      await uploadUserPhoto(currentLevel, videoData);
    } catch (error) {
      console.error("Error uploading camera recording:", error);
    }
  }, [currentLevel, user]);

  const handleLose = useCallback(async (reason) => {
    if (hasCapturedPhoto.current || isTransitioningRef.current) return;
    hasCapturedPhoto.current = true;
    isTransitioningRef.current = true;
    clearLossTimers();
    setIsTransitioning(true);
    setGameState({ isPlaying: false });
    setIsGameActive(false);

    if (videoRef.current) {
      videoRef.current.pause();
    }

    try {
      await Promise.race([
        stopAndUploadCameraRecording(),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
    } catch (err) {
      console.error("Error uploading camera recording, continuing anyway", err);
    }

    setTimeout(() => {
      navigate("/lose", { state: { reason } });
    }, 100);
  }, [setIsGameActive, stopAndUploadCameraRecording, navigate, clearLossTimers]);

  const armLossTimer = useCallback((timerRef, reason, delayMs) => {
    if (timerRef.current || hasCapturedPhoto.current || isTransitioningRef.current) return;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      handleLose(reason);
    }, delayMs);
  }, [handleLose]);

  const handleVideoEnd = useCallback(async () => {
    if (gameState.isPlaying && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      clearLossTimers();
      setIsTransitioning(true);
      setGameState({ isPlaying: false });
      setIsGameActive(false);

      try {
        await Promise.race([
          stopAndUploadCameraRecording(),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);
      } catch (err) {
        console.error("Error uploading camera recording on win, continuing anyway", err);
      }

      if (user && !user.isGuest) {
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

      setTimeout(() => {
        navigate("/level-complete");
      }, 100);
    }
  }, [gameState.isPlaying, setIsGameActive, unlockNextLevel, navigate, currentLevel, user, stopAndUploadCameraRecording, clearLossTimers]);

  const updateDetectionState = useCallback((state) => {
    setDetectionState((prev) => {
      const smileChanged = Math.abs((state.smileIntensity ?? 0) - (prev.smileIntensity ?? 0)) >= 2;
      const statusChanged =
        state.faceDetected !== prev.faceDetected ||
        state.cameraActive !== prev.cameraActive ||
        state.cameraError !== prev.cameraError ||
        state.loadingModel !== prev.loadingModel ||
        state.eyesOpen?.isOpen !== prev.eyesOpen?.isOpen ||
        state.eyesOnScreen?.isOnScreen !== prev.eyesOnScreen?.isOnScreen;

      return smileChanged || statusChanged ? state : prev;
    });
  }, []);

  const startGame = useCallback(() => {
    hasCapturedPhoto.current = false;
    isTransitioningRef.current = false;
    clearLossTimers();
    setIsTransitioning(false);
    setGameState({ isPlaying: true });
    setIsGameActive(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playsInline = true;
      videoRef.current.muted = false;
      videoRef.current.play()
        .then(startCameraRecording)
        .catch(() => {
          setVideoError("Video could not start. Tap retry.");
          setGameState({ isPlaying: false });
          setIsGameActive(false);
        });
    }

    gsap.to(startScreenRef.current, {
      opacity: 0,
      y: -50,
      duration: 0.4,
      ease: "power3.in",
      onComplete: () => gsap.set(startScreenRef.current, { display: "none" })
    });

    gsap.to([levelRef.current, ".back-btn"], {
      opacity: 0,
      y: -30,
      duration: 0.4,
      ease: "power3.out"
    });

    gsap.fromTo(
      smileIndicatorRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
    );
  }, [clearLossTimers, setIsGameActive, startCameraRecording]);

  const isGamePlaying = gameState.isPlaying;
  useEffect(() => {
    const detectionReady = detectionState.cameraActive && !detectionState.loadingModel;

    if (!isGamePlaying || !detectionReady || isTransitioning) {
      clearLossTimers();
      return;
    }

    if (detectionState.smileIntensity > LOSS_RULES.maxSmilePercent) {
      armLossTimer(smileTimerRef, "smile", LOSS_RULES.smileGraceMs);
    } else if (smileTimerRef.current) {
      clearTimeout(smileTimerRef.current);
      smileTimerRef.current = null;
    }

    if (!detectionState.faceDetected) {
      armLossTimer(faceMissingTimerRef, "face-missing", LOSS_RULES.faceMissingGraceMs);
      if (lookAwayTimerRef.current) {
        clearTimeout(lookAwayTimerRef.current);
        lookAwayTimerRef.current = null;
      }
      if (eyesClosedTimerRef.current) {
        clearTimeout(eyesClosedTimerRef.current);
        eyesClosedTimerRef.current = null;
      }
      return;
    } else if (faceMissingTimerRef.current) {
      clearTimeout(faceMissingTimerRef.current);
      faceMissingTimerRef.current = null;
    }

    if (!detectionState.eyesOnScreen?.isOnScreen) {
      armLossTimer(lookAwayTimerRef, "look-away", LOSS_RULES.lookAwayGraceMs);
    } else if (lookAwayTimerRef.current) {
      clearTimeout(lookAwayTimerRef.current);
      lookAwayTimerRef.current = null;
    }

    if (!detectionState.eyesOpen?.isOpen) {
      armLossTimer(eyesClosedTimerRef, "eyes-closed", LOSS_RULES.eyesClosedGraceMs);
    } else if (eyesClosedTimerRef.current) {
      clearTimeout(eyesClosedTimerRef.current);
      eyesClosedTimerRef.current = null;
    }
  }, [detectionState, isGamePlaying, isTransitioning, armLossTimer, clearLossTimers]);

  useEffect(() => {
    return () => {
      clearLossTimers();
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
    };
  }, [clearLossTimers]);

  const cameraReady = detectionState.cameraActive && !detectionState.loadingModel && !detectionState.cameraError;
  const canStartGame = !isLoadingVideo && isVideoReady && cameraReady && volumeConfirmed;
  const startButtonLabel = (() => {
    if (!isVideoReady) return "Video Loading";
    if (detectionState.cameraError) return "Allow Camera";
    if (!cameraReady) return "Camera Warming Up";
    if (!volumeConfirmed) return "Confirm Volume";
    return "Start Level";
  })();

  return (
    <div className="game-page">
      <button
        className="back-btn"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={24} />
      </button>

      <div ref={levelRef} className="level-indicator glass-card">
        <div className="level-number">Level {currentLevel}</div>
        <div className="tagline">
          {isGuest ? "Guest preview — Register to unlock more levels" : "Keep a Straight Face or Lose It All"}
        </div>
      </div>

      <div ref={faceCircleRef} className="face-circle glass-card">
        <FaceExpression
          ref={faceExpressionRef}
          className="face-circle-inner"
          onDetectionUpdate={updateDetectionState}
        />
      </div>

      {isLoadingVideo ? (
        <div className="loading-screen">
          <div className="loader-spinner" />
          <p className="loader-text">Loading video...</p>
        </div>
      ) : videoError ? (
        <div className="loading-screen">
          <p className="loader-text">{videoError}</p>
          <button
            className="start-game-btn btn-primary"
            onClick={() => {
              setIsLoadingVideo(true);
              setIsVideoReady(false);
              videoReadyRef.current = false;
              setVideoError("");
              getVideoByLevel(currentLevel)
                .then((data) => {
                  setVideoUrl(data.videoUrl || "");
                  setVideoLoadNonce((nonce) => nonce + 1);
                })
                .catch(() => setVideoError("Video failed to load. Tap retry."))
                .finally(() => setIsLoadingVideo(false));
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <video
          key={`${currentLevel}-${videoLoadNonce}-${videoUrl}`}
          ref={videoRef}
          className="fullscreen-video"
          src={videoUrl}
          onEnded={handleVideoEnd}
          playsInline
          preload="auto"
          onCanPlay={() => {
            videoReadyRef.current = true;
            setIsVideoReady(true);
            setVideoError("");
          }}
          onError={() => setVideoError("Video failed to load. Tap retry.")}
        />
      )}

      {!gameState.isPlaying && !isLoadingVideo && !videoError && !isTransitioning && (
        <div ref={startScreenRef} className="start-screen-overlay">
          <div className="start-screen-content glass-card">
            <div className="level-preview">Level {currentLevel}</div>
            <div className="rules">
              <h3 className="rules-title">How to Win:</h3>
              <ul className="rules-list">
                <li>Smile must stay under 20%</li>
                <li>Eyes closed for 1 second loses</li>
                <li>Keep your face and eyes on camera</li>
              </ul>
            </div>

            <div className="preflight-checks">
              {isGuest && (
                <div className="preflight-item waiting">
                  <Lock size={20} />
                  <span>Playing as guest — only level 1 is available</span>
                </div>
              )}
              <div className={`preflight-item ${cameraReady ? "ready" : "waiting"}`}>
                <Camera size={20} />
                <span>{detectionState.cameraError || (cameraReady ? "Camera ready" : "Allow camera permission")}</span>
              </div>
              <label className={`preflight-item preflight-checkbox ${volumeConfirmed ? "ready" : "waiting"}`}>
                <input
                  type="checkbox"
                  checked={volumeConfirmed}
                  onChange={(event) => setVolumeConfirmed(event.target.checked)}
                />
                <Volume2 size={20} />
                <span>Mobile volume is at least 70%</span>
              </label>
              {isGuest && (
                <div className="preflight-item ready" style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                  <span>Want more levels? <Link to="/register" style={{ color: "#3b82f6", fontWeight: 600 }}>Register</Link> to play everything.</span>
                </div>
              )}
            </div>

            <button
              className="start-game-btn btn-primary"
              onClick={startGame}
              disabled={!canStartGame}
            >
              {startButtonLabel}
            </button>
          </div>
        </div>
      )}

      {gameState.isPlaying && (
        <div ref={smileIndicatorRef} className="smile-indicator glass-card">
          <div className="smile-label">
            <Smile size={20} />
            Smile Meter
          </div>
          <div className="smile-bar-container">
            <div
              className={`smile-bar ${detectionState.smileIntensity > LOSS_RULES.maxSmilePercent ? "danger" : ""}`}
              style={{ width: `${detectionState.smileIntensity}%` }}
            />
          </div>
          <div className="smile-value">{Math.round(detectionState.smileIntensity)}%</div>
        </div>
      )}
    </div>
  );
}
