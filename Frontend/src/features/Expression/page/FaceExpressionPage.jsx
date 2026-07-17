import { useEffect, useRef, useState } from "react";
import "../styles/faceExpression.scss";
import {
  EMOTION_COLORS,
  playBeep,
  initializeFaceLandmarker,
  renderFaceMesh,
  processFaceDetection
} from "../utils/faceExpressionLogic";
import { useAuth } from "../../auth/hooks/useAuth";

export default function FaceExpressionPage() {
  const { user, handleLogout } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const smoothedEmotionsRef = useRef({});
  const smoothedValenceRef = useRef(0);
  const smoothedArousalRef = useRef(0);
  const calibrationRef = useRef(null);
  const streamRef = useRef(null);

  // States
  const [expression, setExpression] = useState("😐 Waiting...");
  const [confidence, setConfidence] = useState(0);
  const [valence, setValence] = useState(0);
  const [arousal, setArousal] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationData, setCalibrationData] = useState(null);
  const [calibrationCountdown, setCalibrationCountdown] = useState(0);
  const [activeBlendshapes, setActiveBlendshapes] = useState({});
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(true);
  const [smileIntensity, setSmileIntensity] = useState(0);
  const [eyesOpen, setEyesOpen] = useState({ isOpen: true, score: 0 });
  const [eyesOnScreen, setEyesOnScreen] = useState({ isOnScreen: true, score: 0 });

  const currentEmotionName = expression.split(" ").slice(1).join(" ");
  const accentColor = EMOTION_COLORS[currentEmotionName] || "#6366f1";

  // Start Neutral Calibration
  const triggerCalibration = () => {
    setIsCalibrating(true);
    setCalibrationCountdown(3);
    playBeep(880, 0.15);
  };

  // Handle Calibration countdown updates
  useEffect(() => {
    if (calibrationCountdown > 0) {
      const timer = setTimeout(() => {
        setCalibrationCountdown(prev => prev - 1);
        if (calibrationCountdown === 1) {
          playBeep(1200, 0.4);
        } else {
          playBeep(880, 0.1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCalibrating && calibrationCountdown === 0) {
      calibrationRef.current = {
        framesRemaining: 30,
        samples: []
      };
    }
  }, [calibrationCountdown, isCalibrating]);

  // Initialize camera and model - ONLY ONCE!
  useEffect(() => {
    async function initialize() {
      try {
        setLoadingModel(true);
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          // Wait for video metadata to load to get dimensions
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => resolve();
          });
          await videoRef.current.play();
          setCameraActive(true);
        }

        faceLandmarkerRef.current = await initializeFaceLandmarker();
        setLoadingModel(false);
        detect();
      } catch (err) {
        console.error("Initialization failed:", err);
        setExpression("❌ Camera Access / Model Load Failed");
        setLoadingModel(false);
      }
    }

    function detect() {
      if (!videoRef.current || !faceLandmarkerRef.current || !canvasRef.current) return;

      if (videoRef.current.readyState < 2) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Dynamically set canvas size to match video's display dimensions
      if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
      }

      const ctx = canvas.getContext("2d");

      const timestamp = performance.now();
      const result = faceLandmarkerRef.current.detectForVideo(
        videoRef.current,
        timestamp
      );

      if (result.faceBlendshapes?.length && result.faceLandmarks?.length) {
        const blendMap = Object.fromEntries(
          result.faceBlendshapes[0].categories.map((item) => [
            item.categoryName,
            item.score,
          ])
        );

        if (calibrationRef.current && calibrationRef.current.framesRemaining > 0) {
          calibrationRef.current.samples.push(blendMap);
          calibrationRef.current.framesRemaining--;

          if (calibrationRef.current.framesRemaining === 0) {
            const averages = {};
            const keys = Object.keys(blendMap);
            keys.forEach(k => {
              const sum = calibrationRef.current.samples.reduce((acc, s) => acc + s[k], 0);
              averages[k] = sum / calibrationRef.current.samples.length;
            });
            setCalibrationData(averages);
            setIsCalibrating(false);
          }
        }

        const processed = processFaceDetection(
          result,
          calibrationData,
          smoothedEmotionsRef,
          smoothedValenceRef,
          smoothedArousalRef
        );

        setExpression(processed.expression);
        setConfidence(processed.confidence);
        setValence(processed.valence);
        setArousal(processed.arousal);
        setActiveBlendshapes(processed.activeBlendshapes);
        setSmileIntensity(processed.smileIntensity);
        setEyesOpen(processed.eyesOpen);
        setEyesOnScreen(processed.eyesOnScreen);

        renderFaceMesh(ctx, canvas, processed.landmarks, accentColor);
      } else {
        const processed = processFaceDetection(
          result,
          calibrationData,
          smoothedEmotionsRef,
          smoothedValenceRef,
          smoothedArousalRef
        );

        setExpression(processed.expression);
        setConfidence(processed.confidence);
        setValence(processed.valence);
        setArousal(processed.arousal);
        setActiveBlendshapes(processed.activeBlendshapes);
        setSmileIntensity(processed.smileIntensity);
        setEyesOpen(processed.eyesOpen);
        setEyesOnScreen(processed.eyesOnScreen);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(detect);
    }

    initialize();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // NO DEPENDENCIES - ONLY RUN ONCE!

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Moodify</h1>
          <p className="app-subtitle">Facial Expression Detection</p>
        </div>
        <div className="header-right">
          <span className="user-info">👋 {user?.username}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Left: Video Feed */}
        <section className="video-section">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video"
            />
            <canvas
              ref={canvasRef}
              className="mesh-canvas"
            />
            
            {loadingModel && (
              <div className="loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Loading...</p>
              </div>
            )}

            {isCalibrating && (
              <div className="calibration">
                <div className="calibration-circle"></div>
                <p className="calibration-number">
                  {calibrationCountdown > 0 ? calibrationCountdown : "Hold Still"}
                </p>
                <p className="calibration-text">Calibrating Neutral</p>
              </div>
            )}
          </div>

          <button 
            onClick={triggerCalibration}
            disabled={isCalibrating || loadingModel || !cameraActive}
            className="calibrate-btn"
          >
            {isCalibrating ? "Calibrating..." : "Calibrate Neutral"}
          </button>

          {/* Smile Intensity Bar */}
          <div className="smile-section">
            <div className="smile-bar-header">
              <span className="smile-label">😊 Smile Intensity</span>
              <span className="smile-value">{Math.round(smileIntensity)}%</span>
            </div>
            <div className="smile-bar-container">
              <div 
                className="smile-bar-fill"
                style={{ 
                  width: `${smileIntensity}%`,
                  background: `linear-gradient(to right, #3b82f6, #22c55e, #eab308)`
                }} 
              />
            </div>
          </div>

          {/* Eyes Status Section */}
          <div className="eyes-status-container">
            {/* Eyes Open Status */}
            <div className={`eyes-status ${(eyesOpen?.isOpen ?? true) ? 'good' : 'bad'}`}>
              <span className="eyes-icon">{(eyesOpen?.isOpen ?? true) ? '👁️' : '😴'}</span>
              <div className="eyes-status-content">
                <span className="eyes-text">
                  {(eyesOpen?.isOpen ?? true) ? "Eyes Open" : "Open your eyes!"}
                </span>
                <div className="eyes-score-bar">
                  <div 
                    className="eyes-score-fill"
                    style={{ 
                      width: `${(eyesOpen?.score ?? 1) * 100}%`,
                      backgroundColor: (eyesOpen?.isOpen ?? true) ? '#22c55e' : '#ef4444'
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Eyes on Screen Status */}
            <div className={`eyes-status ${(eyesOnScreen?.isOnScreen ?? true) ? 'good' : 'bad'}`}>
              <span className="eyes-icon">{(eyesOnScreen?.isOnScreen ?? true) ? '🎯' : '👀'}</span>
              <div className="eyes-status-content">
                <span className="eyes-text">
                  {(eyesOnScreen?.isOnScreen ?? true) ? "Eyes on Camera" : "Look at the camera!"}
                </span>
                <div className="eyes-score-bar">
                  <div 
                    className="eyes-score-fill"
                    style={{ 
                      width: `${(eyesOnScreen?.score ?? 1) * 100}%`,
                      backgroundColor: (eyesOnScreen?.isOnScreen ?? true) ? '#22c55e' : '#ef4444'
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Data Display */}
        <section className="data-section">
          {/* Expression Display */}
          <div className="data-card">
            <p className="data-label">Detected Expression</p>
            <h2 className="expression-display" style={{ color: accentColor }}>
              {expression}
            </h2>
          </div>

          {/* Confidence */}
          <div className="data-card">
            <div className="confidence-header">
              <span className="data-label">Confidence</span>
              <span className="confidence-value">{Math.round(confidence * 100)}%</span>
            </div>
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ 
                  width: `${confidence * 100}%`,
                  backgroundColor: accentColor
                }} 
              />
            </div>
          </div>

          {/* Valence & Arousal */}
          <div className="data-card">
            <div className="valence-arousal">
              <div className="valence-arousal-item">
                <span className="valence-arousal-label">Valence</span>
                <span className="valence-arousal-value">{valence.toFixed(2)}</span>
              </div>
              <div className="valence-arousal-item">
                <span className="valence-arousal-label">Arousal</span>
                <span className="valence-arousal-value">{arousal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Blendshapes */}
          <div className="data-card blendshapes-card">
            <p className="data-label">FACS Blendshapes</p>
            <div className="blendshapes-list">
              {Object.entries(activeBlendshapes).map(([name, val]) => (
                <div key={name} className="blendshape-item">
                  <div className="blendshape-info">
                    <span className="blendshape-name">{name}</span>
                    <span className="blendshape-value">{(val * 100).toFixed(0)}%</span>
                  </div>
                  <div className="blendshape-bar">
                    <div 
                      className="blendshape-fill"
                      style={{ 
                        width: `${val * 100}%`,
                        backgroundColor: accentColor
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
