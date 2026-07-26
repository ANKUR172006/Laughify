import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// -------------------------------
// STABILITY UTILITIES (EMA, etc.)
// -------------------------------
export const EMA = (current, previous, alpha = 0.2) => alpha * current + (1 - alpha) * previous;

export const MovingAverage = (values, windowSize = 5) => {
  if (values.length === 0) return 0;
  const window = values.slice(-windowSize);
  return window.reduce((a, b) => a + b, 0) / window.length;
};

export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

// -------------------------------
// EMOTION CONSTANTS
// -------------------------------
export const EMOTION_COORDINATES = {
  "Neutral": { x: 0.0, y: 0.0 },
  "Genuine Happy": { x: 0.85, y: 0.45 },
  "Excited": { x: 0.95, y: 0.9 },
  "Surprised": { x: 0.35, y: 0.95 },
  "Sadness": { x: -0.85, y: -0.65 },
  "Anger": { x: -0.75, y: 0.75 },
  "Disgust": { x: -0.85, y: 0.25 },
  "Fear": { x: -0.65, y: 0.85 },
  "Kiss / Pucker": { x: 0.45, y: 0.15 },
  "Winking / Smirking": { x: 0.65, y: 0.35 },
  "Thinking / Skeptical": { x: -0.15, y: 0.15 },
  "Bored / Tired": { x: -0.35, y: -0.75 },
  "Eyes Closed": { x: 0.0, y: -0.5 }
};

export const EMOTION_COLORS = {
  "Neutral": "#94a3b8",
  "Genuine Happy": "#22c55e",
  "Excited": "#eab308",
  "Surprised": "#06b6d4",
  "Sadness": "#3b82f6",
  "Anger": "#ef4444",
  "Disgust": "#a855f7",
  "Fear": "#f97316",
  "Kiss / Pucker": "#ec4899",
  "Winking / Smirking": "#10b981",
  "Thinking / Skeptical": "#6366f1",
  "Bored / Tired": "#64748b",
  "Eyes Closed": "#1e293b"
};

export const getEmotionName = (expression) => {
  if (!expression) return "Neutral";
  return String(expression).replace(/^[^\w]+/, "").trim();
};

export const LANDMARK_CONNECTIONS = {
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362],
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  lipsOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 95, 88, 146],
  lipsInner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78],
  faceContour: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377,
    152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
  ]
};

export const playBeep = (freq, duration) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context block", e);
  }
};

export const initializeFaceLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  return await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    },
    runningMode: "VIDEO",
    outputFaceBlendshapes: true,
    outputFaceLandmarks: true,
    outputFacialTransformationMatrixes: true,
    numFaces: 1,
    minFaceDetectionConfidence: 0.2,
    minFacePresenceConfidence: 0.2,
    minTrackingConfidence: 0.2
  });
};

export const renderFaceMesh = (
  ctx,
  canvas,
  landmarks,
  accentColor,
  scaleX = canvas?.width ?? 0,
  scaleY = canvas?.height ?? 0,
  offsetX = 0,
  offsetY = 0
) => {
  if (!ctx || !canvas || !landmarks) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 2;
  ctx.strokeStyle = accentColor || "#6366f1";
  ctx.globalAlpha = 0.8;

  Object.entries(LANDMARK_CONNECTIONS).forEach(([, indices]) => {
    ctx.beginPath();
    let firstPoint = true;
    indices.forEach((i) => {
      const pt = landmarks[i];
      if (pt) {
        const x = offsetX + (1 - pt.x) * scaleX;
        const y = offsetY + pt.y * scaleY;
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();
  });

  ctx.fillStyle = accentColor || "#6366f1";
  ctx.globalAlpha = 1;
  landmarks.forEach((pt) => {
    if (pt) {
      const x = offsetX + (1 - pt.x) * scaleX;
      const y = offsetY + pt.y * scaleY;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  ctx.restore();
};

// -------------------------------
// HEAD POSE EXTRACTION
// -------------------------------
export const extractHeadPose = (transformationMatrix) => {
  if (!transformationMatrix || transformationMatrix.length < 16) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }
  const m = transformationMatrix;
  let yaw = Math.atan2(m[4], m[0]);
  let pitch = Math.asin(-m[8]);
  let roll = Math.atan2(m[9], m[10]);

  yaw = yaw * (180 / Math.PI);
  pitch = pitch * (180 / Math.PI);
  roll = roll * (180 / Math.PI);

  return { yaw, pitch, roll };
};

// -------------------------------
// CALIBRATION DATA
// -------------------------------
export const createDefaultCalibration = () => ({
  smileBaseline: 0.1,
  eyeOpenBaselineLeft: 0.1,
  eyeOpenBaselineRight: 0.1,
  poseBaselineYaw: 0,
  poseBaselinePitch: 0,
  blendshapes: {}
});

// -------------------------------
// PROCESS DETECTION
// -------------------------------
export const processFaceDetection = (result, calibrationData, stateRef) => {
  if (!result.faceBlendshapes?.length || !result.faceLandmarks?.length) {
    const valence = EMA(0, stateRef?.smoothedValence ?? 0, 0.05);
    const arousal = EMA(0, stateRef?.smoothedArousal ?? 0, 0.05);

    if (stateRef) {
      stateRef.smoothedValence = valence;
      stateRef.smoothedArousal = arousal;
    }

    return {
      expression: "No Face Detected",
      confidence: 0,
      valence,
      arousal,
      activeBlendshapes: {},
      landmarks: null,
      smileIntensity: 0,
      eyesOpen: { isOpen: true, score: 1, leftBlink: 0, rightBlink: 0 },
      eyesOnScreen: { isOnScreen: true, score: 1, yaw: 0, pitch: 0 },
      blendMap: {}
    };
  }

  const landmarks = result.faceLandmarks[0];
  const blendMap = Object.fromEntries(
    result.faceBlendshapes[0].categories.map((item) => [
      item.categoryName,
      item.score,
    ])
  );

  const score = (name) => {
    const raw = blendMap[name] ?? 0;
    const baseline = calibrationData?.blendshapes?.[name];
    if (!Number.isFinite(baseline)) return raw;
    return clamp((raw - baseline) / clamp(1 - baseline, 0.01, 1));
  };

  const averageScore = (...names) => (
    names.reduce((sum, name) => sum + score(name), 0) / names.length
  );

  const smile = averageScore("mouthSmileLeft", "mouthSmileRight");
  const rawSmile = (
    smile * 0.6 +
    averageScore("mouthDimpleLeft", "mouthDimpleRight") * 0.35 +
    averageScore("cheekSquintLeft", "cheekSquintRight") * 0.05
  );
  const jawOpenRaw = blendMap.jawOpen ?? 0;
  const talkingFactor = jawOpenRaw > 0.25 ? 0.5 : 1;
  const smileIntensity = clamp(rawSmile * talkingFactor, 0, 1) * 100;

  const blinkLeft = blendMap.eyeBlinkLeft ?? 0;
  const blinkRight = blendMap.eyeBlinkRight ?? 0;
  const eyesOpenScore = 1 - (blinkLeft + blinkRight) / 2;

  const transformationMatrix = result.faceTransformationMatrixes?.[0];
  const pose = extractHeadPose(transformationMatrix);
  const landmarksValid = (() => {
    if (!landmarks) return false;
    const margin = 0.12;
    const keyIndices = [1, 33, 263];
    return keyIndices.every((i) => {
      const lm = landmarks[i];
      if (!lm) return false;
      return lm.x >= margin && lm.x <= 1 - margin && lm.y >= margin && lm.y <= 1 - margin;
    });
  })();

  const maxGaze = Math.max(
    blendMap.eyeLookInLeft ?? 0,
    blendMap.eyeLookOutLeft ?? 0,
    blendMap.eyeLookInRight ?? 0,
    blendMap.eyeLookOutRight ?? 0
  );
  const gazeValid = maxGaze < 0.8;
  const poseValid = Math.abs(pose.yaw - (calibrationData?.poseBaselineYaw ?? 0)) < 35 &&
    Math.abs(pose.pitch - (calibrationData?.poseBaselinePitch ?? 0)) < 30;
  const eyesOnScreen = landmarksValid && poseValid && gazeValid;

  const frown = averageScore("mouthFrownLeft", "mouthFrownRight");
  const browUp = score("browInnerUp");
  const browDown = averageScore("browDownLeft", "browDownRight");
  const eyeWide = averageScore("eyeWideLeft", "eyeWideRight");
  const cheekSquint = averageScore("cheekSquintLeft", "cheekSquintRight");
  const noseSneer = averageScore("noseSneerLeft", "noseSneerRight");
  const mouthPress = averageScore("mouthPressLeft", "mouthPressRight");
  const mouthPucker = score("mouthPucker");
  const mouthShrug = averageScore("mouthShrugUpper", "mouthShrugLower");
  const mouthFunnel = score("mouthFunnel");
  const jawDrop = score("jawOpen");
  const blink = averageScore("eyeBlinkLeft", "eyeBlinkRight");
  const wink = Math.abs(score("eyeBlinkLeft") - score("eyeBlinkRight"));
  const smirk = Math.max(
    Math.abs(score("mouthSmileLeft") - score("mouthSmileRight")),
    score("mouthLeft"),
    score("mouthRight")
  );

  const candidates = [
    { name: "Eyes Closed", value: blink * 1.2 },
    { name: "Excited", value: smile * 0.7 + eyeWide * 0.35 + browUp * 0.25 + jawDrop * 0.15 },
    { name: "Genuine Happy", value: smile * 0.75 + cheekSquint * 0.35 - frown * 0.2 },
    { name: "Surprised", value: jawDrop * 0.45 + eyeWide * 0.4 + browUp * 0.35 - smile * 0.15 },
    { name: "Anger", value: browDown * 0.55 + mouthPress * 0.25 + eyeWide * 0.15 + frown * 0.15 },
    { name: "Sadness", value: frown * 0.5 + mouthShrug * 0.3 + browUp * 0.2 - smile * 0.2 },
    { name: "Disgust", value: noseSneer * 0.55 + mouthPress * 0.25 + frown * 0.2 },
    { name: "Fear", value: eyeWide * 0.35 + browUp * 0.35 + jawDrop * 0.2 + frown * 0.15 },
    { name: "Kiss / Pucker", value: mouthPucker * 0.65 + mouthFunnel * 0.35 },
    { name: "Winking / Smirking", value: wink * 0.55 + smirk * 0.35 + smile * 0.2 },
    { name: "Thinking / Skeptical", value: browDown * 0.25 + smirk * 0.25 + mouthPress * 0.2 },
    { name: "Bored / Tired", value: blink * 0.25 + mouthShrug * 0.2 + frown * 0.2 + (1 - eyesOpenScore) * 0.2 }
  ];

  let best = candidates.reduce((currentBest, item) => (
    item.value > currentBest.value ? item : currentBest
  ), { name: "Neutral", value: 0 });

  const neutralScore = clamp(
    1 - Math.max(smile, frown, browUp, browDown, eyeWide, noseSneer, mouthPress, mouthPucker, jawDrop, blink),
    0,
    1
  );
  if (best.value < 0.22 || neutralScore > best.value + 0.15) {
    best = { name: "Neutral", value: neutralScore };
  }

  const targetValence = EMOTION_COORDINATES[best.name]?.x ?? 0;
  const targetArousal = EMOTION_COORDINATES[best.name]?.y ?? 0;
  const valence = EMA(targetValence, stateRef?.smoothedValence ?? targetValence, 0.25);
  const arousal = EMA(targetArousal, stateRef?.smoothedArousal ?? targetArousal, 0.25);

  if (stateRef) {
    stateRef.smoothedValence = valence;
    stateRef.smoothedArousal = arousal;
  }

  const activeBlendshapes = {
    "Smile": smile,
    "Frown": frown,
    "Jaw Open": jawDrop,
    "Eyebrows Up": browUp,
    "Eyebrows Down": browDown,
    "Eyes Wide": eyeWide,
    "Cheeks Squint": cheekSquint,
    "Nose Wrinkle": noseSneer,
    "Mouth Press": mouthPress,
    "Mouth Pucker": mouthPucker
  };

  return {
    expression: best.name,
    confidence: clamp(best.value, 0, 1),
    valence,
    arousal,
    activeBlendshapes,
    landmarks,
    smileIntensity,
    eyesOpen: { isOpen: eyesOpenScore > 0.4, score: eyesOpenScore, leftBlink: blinkLeft, rightBlink: blinkRight },
    eyesOnScreen: { isOnScreen: eyesOnScreen, score: eyesOnScreen ? 1 : 0.3, yaw: pose.yaw, pitch: pose.pitch },
    blendMap,
    pose
  };
};
