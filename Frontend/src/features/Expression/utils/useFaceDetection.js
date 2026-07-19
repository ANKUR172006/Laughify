import { useEffect, useRef, useState } from "react";
import {
  EMOTION_COLORS,
  initializeFaceLandmarker,
  renderFaceMesh,
  processFaceDetection
} from "./faceExpressionLogic";

export const useFaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const smoothedEmotionsRef = useRef({});
  const smoothedValenceRef = useRef(0);
  const smoothedArousalRef = useRef(0);
  const calibrationRef = useRef(null);
  const streamRef = useRef(null);
  const lastFrameTimeRef = useRef(0); // Throttle detection to reduce load

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
  const [eyesOpen, setEyesOpen] = useState({ isOpen: true, score: 1 });
  const [eyesOnScreen, setEyesOnScreen] = useState({ isOnScreen: true, score: 1 });
  const [faceDetected, setFaceDetected] = useState(false);
  const [accentColor, setAccentColor] = useState("#6366f1");

  // Handle Calibration countdown updates
  useEffect(() => {
    if (calibrationCountdown > 0) {
      const timer = setTimeout(() => {
        setCalibrationCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [calibrationCountdown]);

  // Initialize camera and model - ONLY ONCE!
  useEffect(() => {
    async function initialize() {
      try {
        setLoadingModel(true);
        
        // Load model and camera in parallel to save time!
        const modelPromise = initializeFaceLandmarker();
        const cameraPromise = navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 }, // Slightly higher resolution for better detection accuracy
            height: { ideal: 480 },
            facingMode: "user"
          },
        });

        // Wait for both to finish
        const [model, stream] = await Promise.all([modelPromise, cameraPromise]);
        faceLandmarkerRef.current = model;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true; // Muted for autoplay on mobile
          videoRef.current.playsInline = true; // Critical for iOS
          // Don't wait for onloadedmetadata, just play immediately (faster!)
          videoRef.current.play().catch(e => console.warn("Video play failed:", e));
          setCameraActive(true);
        }

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

      // Throttle detection to ~20fps to balance speed and performance (every ~50ms)
      const now = performance.now();
      if (now - lastFrameTimeRef.current < 50) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }
      lastFrameTimeRef.current = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;

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

      const hasFace = result.faceBlendshapes?.length && result.faceLandmarks?.length;
      setFaceDetected(hasFace);

      if (hasFace) {
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

        const currentEmotionName = processed.expression.split(" ").slice(1).join(" ");
        const newAccentColor = EMOTION_COLORS[currentEmotionName] || "#6366f1";
        setAccentColor(newAccentColor);

        renderFaceMesh(ctx, canvas, processed.landmarks, newAccentColor);
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
  }, []);

  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationCountdown(3);
    calibrationRef.current = {
      framesRemaining: 30,
      samples: []
    };
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
