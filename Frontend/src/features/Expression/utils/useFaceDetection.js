import { useEffect, useRef, useState } from "react";
import {
  EMOTION_COLORS,
  initializeFaceLandmarker,
  processFaceDetection,
  createDefaultCalibration,
  EMA,
  MovingAverage,
  playBeep,
  getEmotionName
} from "./faceExpressionLogic";

export const useFaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const calibrationIntervalRef = useRef(null);

  const stateRef = useRef({
    smoothedSmile: 0,
    smoothedEyesOpen: 1,
    smoothedEyesOnScreen: true,
    smoothedValence: 0,
    smoothedArousal: 0,
    eyesClosedSince: null,
    faceAwaySince: null,
    faceDetectedSince: null,
    lastFaceDetected: null,
    calibration: createDefaultCalibration(),
    isCalibrating: false,
    calibrationSamples: [],
    lastSmileAbove20: false,
    smileHistory: [],
    eyeOpenHistory: [],
    eyesOnScreenHistory: [],
  });

  const [expression, setExpression] = useState("Waiting...");
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

  useEffect(() => {
    let mounted = true;

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

        const now = performance.now();
        if (now - lastFrameTimeRef.current < 33) {
          animationRef.current = requestAnimationFrame(detect);
          return;
        }
        lastFrameTimeRef.current = now;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const displayedWidth = video.clientWidth;
        const displayedHeight = video.clientHeight;

        if (canvas.width !== displayedWidth || canvas.height !== displayedHeight) {
          canvas.width = displayedWidth;
          canvas.height = displayedHeight;
        }

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const result = faceLandmarkerRef.current.detectForVideo(video, now);
        const hasFace = result.faceBlendshapes?.length && result.faceLandmarks?.length;

        const currentTime = Date.now();
        if (hasFace) {
          stateRef.current.faceDetectedSince = stateRef.current.faceDetectedSince ?? currentTime;
          stateRef.current.lastFaceDetected = currentTime;
        } else if (!stateRef.current.lastFaceDetected || currentTime - stateRef.current.lastFaceDetected >= 1000) {
          stateRef.current.faceDetectedSince = null;
        }
        setFaceDetected(stateRef.current.faceDetectedSince !== null);

        const processed = processFaceDetection(result, stateRef.current.calibration, stateRef.current);

        if (hasFace) {
          if (stateRef.current.isCalibrating) {
            stateRef.current.calibrationSamples.push(processed.blendMap);
            if (stateRef.current.calibrationSamples.length >= 30) {
              const avg = {};
              Object.keys(stateRef.current.calibrationSamples[0]).forEach((key) => {
                avg[key] = stateRef.current.calibrationSamples.reduce((sum, sample) => (
                  sum + (sample[key] || 0)
                ), 0) / stateRef.current.calibrationSamples.length;
              });

              stateRef.current.calibration = {
                ...stateRef.current.calibration,
                blendshapes: avg,
                poseBaselineYaw: processed.pose.yaw,
                poseBaselinePitch: processed.pose.pitch,
              };
              stateRef.current.isCalibrating = false;
              stateRef.current.calibrationSamples = [];
              setIsCalibrating(false);
            }
          }

          stateRef.current.smileHistory.push(processed.smileIntensity / 100);
          if (stateRef.current.smileHistory.length > 10) stateRef.current.smileHistory.shift();
          const maSmile = MovingAverage(stateRef.current.smileHistory, 8);
          stateRef.current.smoothedSmile = EMA(maSmile, stateRef.current.smoothedSmile, 0.3);
          const finalSmilePercent = Math.round(stateRef.current.smoothedSmile * 100);

          stateRef.current.eyeOpenHistory.push(processed.eyesOpen.score);
          if (stateRef.current.eyeOpenHistory.length > 10) stateRef.current.eyeOpenHistory.shift();
          const maEyes = MovingAverage(stateRef.current.eyeOpenHistory, 6);
          stateRef.current.smoothedEyesOpen = EMA(maEyes, stateRef.current.smoothedEyesOpen, 0.3);

          stateRef.current.eyesOnScreenHistory.push(processed.eyesOnScreen.isOnScreen ? 1 : 0);
          if (stateRef.current.eyesOnScreenHistory.length > 8) stateRef.current.eyesOnScreenHistory.shift();
          const maEyesOnScreen = MovingAverage(stateRef.current.eyesOnScreenHistory, 6);
          stateRef.current.smoothedEyesOnScreen = maEyesOnScreen > 0.5;

          setSmileIntensity(finalSmilePercent);
          setEyesOpen({
            ...processed.eyesOpen,
            score: stateRef.current.smoothedEyesOpen,
            isOpen: stateRef.current.smoothedEyesOpen > 0.4
          });
          setEyesOnScreen({
            ...processed.eyesOnScreen,
            isOnScreen: stateRef.current.smoothedEyesOnScreen
          });
          setActiveBlendshapes(processed.activeBlendshapes);
          setExpression(processed.expression);
          setConfidence(processed.confidence);
          setValence(processed.valence);
          setArousal(processed.arousal);

          const newAccentColor = EMOTION_COLORS[getEmotionName(processed.expression)] || "#6366f1";
          setAccentColor(newAccentColor);
        } else {
          setExpression(processed.expression);
          setConfidence(processed.confidence);
          setValence(processed.valence);
          setArousal(processed.arousal);
          setActiveBlendshapes(processed.activeBlendshapes);
          setSmileIntensity(processed.smileIntensity);
        }

        animationRef.current = requestAnimationFrame(detect);
      };

      animationRef.current = requestAnimationFrame(detect);
    };

    const init = async () => {
      try {
        setLoadingModel(true);

        const [model, stream] = await Promise.all([
          initializeFaceLandmarker(),
          navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
          })
        ]);

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        faceLandmarkerRef.current = model;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.play().catch((e) => console.warn("Video play failed:", e));
          setCameraActive(true);
        }

        setLoadingModel(false);
        startDetectionLoop();
      } catch (err) {
        console.error("Init failed:", err);
        setExpression("Error loading camera/model");
        setLoadingModel(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (calibrationIntervalRef.current) clearInterval(calibrationIntervalRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCalibration = () => {
    if (loadingModel || !cameraActive || isCalibrating) return;

    if (calibrationIntervalRef.current) clearInterval(calibrationIntervalRef.current);

    setIsCalibrating(true);
    setCalibrationCountdown(3);
    stateRef.current.isCalibrating = false;
    stateRef.current.calibrationSamples = [];
    playBeep(880, 0.15);

    let countdown = 3;
    calibrationIntervalRef.current = setInterval(() => {
      countdown -= 1;
      setCalibrationCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(calibrationIntervalRef.current);
        calibrationIntervalRef.current = null;
        stateRef.current.isCalibrating = true;
        playBeep(1200, 0.4);
      } else {
        playBeep(880, 0.1);
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
