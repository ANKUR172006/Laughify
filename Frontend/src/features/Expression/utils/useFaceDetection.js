import { useEffect, useRef, useState } from "react";
import {
  EMOTION_COLORS,
  initializeFaceLandmarker,
  renderFaceMesh,
  processFaceDetection,
  createDefaultCalibration,
  EMA,
  MovingAverage,
  clamp
} from "./faceExpressionLogic";

export const useFaceDetection = () => {
  // Core refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  // State refs (for stability & timing)
  const stateRef = useRef({
    smoothedSmile: 0,
    smoothedEyesOpen: 1,
    smoothedEyesOnScreen: true,
    smoothedValence:0,
    smoothedArousal:0,
    // Timers for game states
    eyesClosedSince: null,
    faceAwaySince: null,
    faceDetectedSince: null,
    lastFaceDetected: null,
    // Calibration data
    calibration: createDefaultCalibration(),
    isCalibrating: false,
    calibrationSamples: [],
    // For hysteresis
    lastSmileAbove20: false,
    // For moving averages
    smileHistory: [],
    eyeOpenHistory: [],
    eyesOnScreenHistory: [],
  });

  // React states for UI
  const [expression, setExpression] = useState("😐 Waiting...");
  const [confidence, setConfidence] = useState(0);
  const [valence, setValence] = useState(0);
  const [arousal, setArousal] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationCountdown, setCalibrationCountdown] = useState(0);
  const [activeBlendshapes, setActiveBlendshapes] = useState({});
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(true);
  const [smileIntensity, setSmileIntensity] = useState(0);
  const [eyesOpen, setEyesOpen] = useState({ isOpen: true, score: 1 });
  const [eyesOnScreen, setEyesOnScreen] = useState({ isOnScreen: true, score: 1 });
  const [faceDetected, setFaceDetected] = useState(false);
  const [accentColor, setAccentColor] = useState("#6366f1");

  // Initialize everything
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoadingModel(true);
        
        // Load model & camera in parallel
        const [model, stream] = await Promise.all([
          initializeFaceLandmarker(),
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
          })
        ]);

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        faceLandmarkerRef.current = model;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.play().catch(e => console.warn("Video play failed:", e));
          setCameraActive(true);
        }

        setLoadingModel(false);
        startDetectionLoop();
      } catch (err) {
        console.error("Init failed:", err);
        setExpression("❌ Error loading camera/model");
        setLoadingModel(false);
      }
    };

    const startDetectionLoop = () => {
      const detect = () => {
        if (!videoRef.current || !faceLandmarkerRef.current || !canvasRef.current) {
          animationRef.current = requestAnimationFrame(detect);
          return;
        }

        if (videoRef.current.readyState < 2) {
          animationRef.current = requestAnimationFrame(detect);
          return;
        }

        // Throttle to ~30fps max
        const now = performance.now();
        if (now - lastFrameTimeRef.current < 33) {
          animationRef.current = requestAnimationFrame(detect);
          return;
        }
        lastFrameTimeRef.current = now;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas to exactly match video element's displayed size
        const displayedWidth = video.clientWidth;
        const displayedHeight = video.clientHeight;
        
        if (canvas.width !== displayedWidth || canvas.height !== displayedHeight) {
          canvas.width = displayedWidth;
          canvas.height = displayedHeight;
        }

        // Get native video dimensions (the actual media resolution)
        const videoNativeWidth = video.videoWidth;
        const videoNativeHeight = video.videoHeight;
        
        // Calculate how much the video needs to be scaled to fill the container (object-fit: cover)
        const scaleFactor = Math.max(displayedWidth / videoNativeWidth, displayedHeight / videoNativeHeight);
        
        // Calculate scaled dimensions of the video that's visible
        const scaledVideoWidth = videoNativeWidth * scaleFactor;
        const scaledVideoHeight = videoNativeHeight * scaleFactor;
        
        // Calculate offset to center the scaled video in the container
        const offsetX = (displayedWidth - scaledVideoWidth) / 2;
        const offsetY = (displayedHeight - scaledVideoHeight) / 2;

        const ctx = canvas.getContext("2d");
        const result = faceLandmarkerRef.current.detectForVideo(video, now);
        const hasFace = result.faceBlendshapes?.length && result.faceLandmarks?.length;

        // Update presence detection & handle brief loss
        const currentTime = Date.now();
        if (hasFace) {
          stateRef.current.faceDetectedSince = stateRef.current.faceDetectedSince ?? currentTime;
          stateRef.current.lastFaceDetected = currentTime;
        } else {
          // If face was recently detected, keep state as detected for 1s
          if (stateRef.current.lastFaceDetected && currentTime - stateRef.current.lastFaceDetected < 1000) {
            // Do nothing, keep previous state
          } else {
            stateRef.current.faceDetectedSince = null;
          }
        }
        setFaceDetected(stateRef.current.faceDetectedSince !== null);

        if (hasFace) {
          const processed = processFaceDetection(result, stateRef.current.calibration, stateRef.current);
          
          // --- Calibration ---
          if (stateRef.current.isCalibrating) {
            stateRef.current.calibrationSamples.push(processed.blendMap);
            if (stateRef.current.calibrationSamples.length >= 30) {
              // Compute averages
              const avg = {};
              Object.keys(stateRef.current.calibrationSamples[0]).forEach(key => {
                avg[key] = stateRef.current.calibrationSamples.reduce((sum, s) => sum + (s[key] || 0), 0) / stateRef.current.calibrationSamples.length;
              });
              // Also get initial pose
              stateRef.current.calibration = {
                ...stateRef.current.calibration,
                blendshapes: avg,
                poseBaselineYaw: processed.pose.yaw,
                poseBaselinePitch: processed.pose.pitch,
              };
              stateRef.current.isCalibrating = false;
              setIsCalibrating(false);
            }
          }

          // --- Apply EMA & Moving Averages ---
          // Smile intensity
          stateRef.current.smileHistory.push(processed.smileIntensity / 100);
          if (stateRef.current.smileHistory.length > 10) stateRef.current.smileHistory.shift();
          const maSmile = MovingAverage(stateRef.current.smileHistory, 8);
          stateRef.current.smoothedSmile = EMA(maSmile, stateRef.current.smoothedSmile, 0.3);
          const finalSmilePercent = Math.round(stateRef.current.smoothedSmile * 100);

          // Eyes open
          stateRef.current.eyeOpenHistory.push(processed.eyesOpen.score);
          if (stateRef.current.eyeOpenHistory.length > 10) stateRef.current.eyeOpenHistory.shift();
          const maEyes = MovingAverage(stateRef.current.eyeOpenHistory, 6);
          stateRef.current.smoothedEyesOpen = EMA(maEyes, stateRef.current.smoothedEyesOpen, 0.3);

          // Eyes on screen
          stateRef.current.eyesOnScreenHistory.push(processed.eyesOnScreen.isOnScreen ? 1 : 0);
          if (stateRef.current.eyesOnScreenHistory.length > 8) stateRef.current.eyesOnScreenHistory.shift();
          const maEyesOnScreen = MovingAverage(stateRef.current.eyesOnScreenHistory, 6);
          stateRef.current.smoothedEyesOnScreen = maEyesOnScreen > 0.5;

          // --- Hysteresis for smile ---
          const isSmileTooBig = finalSmilePercent > 20;

          // --- Update UI state ---
          setSmileIntensity(finalSmilePercent);
          setEyesOpen({ ...processed.eyesOpen, score: stateRef.current.smoothedEyesOpen, isOpen: stateRef.current.smoothedEyesOpen > 0.4 });
          setEyesOnScreen({ ...processed.eyesOnScreen, isOnScreen: stateRef.current.smoothedEyesOnScreen });
          setActiveBlendshapes(processed.activeBlendshapes);
          setExpression(processed.expression);
          setConfidence(processed.confidence);
          setValence(processed.valence);
          setArousal(processed.arousal);

          const currentEmotionName = processed.expression.split(" ").slice(1).join(" ");
          const newAccentColor = EMOTION_COLORS[currentEmotionName] || "#6366f1";
          setAccentColor(newAccentColor);
          
          renderFaceMesh(ctx, canvas, processed.landmarks, newAccentColor, scaledVideoWidth, scaledVideoHeight, offsetX, offsetY);
        } else {
          // Clear canvas if no face
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        animationRef.current = requestAnimationFrame(detect);
      };
      animationRef.current = requestAnimationFrame(detect);
    };

    init();

    return () => {
      mounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationCountdown(3);
    stateRef.current.isCalibrating = true;
    stateRef.current.calibrationSamples = [];

    let countdown = 3;
    const interval = setInterval(() => {
      countdown--;
      setCalibrationCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  };

  return {
    videoRef,
    canvasRef,
    expression,
    confidence,
    valence,
    arousal,
    isCalibrating,
    calibrationCountdown,
    activeBlendshapes,
    cameraActive,
    loadingModel,
    smileIntensity,
    eyesOpen,
    eyesOnScreen,
    faceDetected,
    accentColor,
    startCalibration
  };
};
