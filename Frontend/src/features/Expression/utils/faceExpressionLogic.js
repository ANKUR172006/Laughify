import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Valence & Arousal mapping for emotions
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

// Colors for emotions
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

// Standard landmark connections for rendering holographic lines
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

// Audio/Beep cues for calibration
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

// Initialize Face Landmarker with balanced confidence (no false negatives)
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
    minFaceDetectionConfidence: 0.5, // Balanced (no false negatives)
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
};

// Render Accurate Face Mesh
export const renderFaceMesh = (ctx, canvas, landmarks, accentColor) => {
  if (!ctx || !canvas || !landmarks) return;

  // Get actual canvas dimensions
  const w = canvas.width;
  const h = canvas.height;

  // Save context state
  ctx.save();

  ctx.clearRect(0, 0, w, h);

  // Draw connections with better visibility
  ctx.lineWidth = 2;
  ctx.strokeStyle = accentColor || "#6366f1";
  ctx.globalAlpha = 0.8;

  Object.entries(LANDMARK_CONNECTIONS).forEach(([, indices]) => {
    ctx.beginPath();
    let firstPoint = true;
    indices.forEach((i) => {
      const pt = landmarks[i];
      if (pt) {
        // Map normalized coordinates to canvas, then mirror horizontally
        const x = (1 - pt.x) * w; // Flip X for mirror effect
        const y = pt.y * h;
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

  // Draw key landmarks for better visibility
  ctx.fillStyle = accentColor || "#6366f1";
  ctx.globalAlpha = 1;
  // Draw all landmarks (but smaller)
  landmarks.forEach((pt) => {
    if (pt) {
      const x = (1 - pt.x) * w;
      const y = pt.y * h;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // Restore context state
  ctx.restore();
};

// Solid eyes open detection (trigger if eyes are closed enough)
const checkEyesOpen = (blendMap) => {
  const blinkLeft = blendMap.eyeBlinkLeft || 0;
  const blinkRight = blendMap.eyeBlinkRight || 0;
  
  console.log("DEBUG - eyeBlinkLeft:", blinkLeft, "eyeBlinkRight:", blinkRight);
  
  // Eyes closed if either eye >0.5 OR both >0.4 (more sensitive now)
  const eyesClosed = (blinkLeft > 0.5) || (blinkRight > 0.5) || ((blinkLeft > 0.4) && (blinkRight > 0.4));
  
  return {
    isOpen: !eyesClosed,
    score: 1 - ((blinkLeft + blinkRight) / 2),
    leftBlink: blinkLeft,
    rightBlink: blinkRight
  };
};

// Extract head pose (yaw/pitch/roll) from transformation matrix
const extractHeadPose = (transformationMatrix) => {
  if (!transformationMatrix || transformationMatrix.length < 16) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  // MediaPipe's 4x4 transformation matrix format (column-major)
  const m = transformationMatrix;
  
  // Calculate yaw (left-right rotation)
  let yaw = Math.atan2(m[4], m[0]); // Using rotation components
  
  // Calculate pitch (up-down rotation)
  let pitch = Math.asin(-m[8]);
  
  // Calculate roll (tilt)
  let roll = Math.atan2(m[9], m[10]);
  
  // Convert radians to degrees for easier interpretation
  yaw = yaw * (180 / Math.PI);
  pitch = pitch * (180 / Math.PI);
  roll = roll * (180 / Math.PI);
  
  return { yaw, pitch, roll };
};

// Check if key landmarks are within the frame bounds
const checkLandmarksInFrame = (landmarks, margin = 0.1) => {
  if (!landmarks) return false;
  
  // Key landmarks to check: nose tip (1), left eye outer corner (33), right eye outer corner (263)
  const keyLandmarks = [
    landmarks[1],  // Nose tip
    landmarks[33], // Left eye outer
    landmarks[263] // Right eye outer
  ];
  
  // Check if all key landmarks are within [margin, 1-margin] in x and y
  for (let lm of keyLandmarks) {
    if (!lm) return false;
    if (lm.x < margin || lm.x > (1 - margin) || lm.y < margin || lm.y > (1 - margin)) {
      return false;
    }
  }
  
  return true;
};

// Improved eyes/face on screen detection using both head pose and landmarks
const checkEyesOnScreen = (blendMap, landmarks, transformationMatrix) => {
  // 1. Check landmarks are in frame
  const landmarksValid = checkLandmarksInFrame(landmarks);
  
  // 2. Check head pose (yaw and pitch) - a bit stricter
  const headPose = extractHeadPose(transformationMatrix);
  const maxYaw = 35; // degrees - allow up to 35deg left/right
  const maxPitch = 30; // degrees - allow up to 30deg up/down
  const headPoseValid = Math.abs(headPose.yaw) < maxYaw && Math.abs(headPose.pitch) < maxPitch;
  
  // 3. Still use eyeLook blendshapes as backup, but more relaxed
  const lookInLeft = blendMap.eyeLookInLeft || 0;
  const lookInRight = blendMap.eyeLookInRight || 0;
  const lookOutLeft = blendMap.eyeLookOutLeft || 0;
  const lookOutRight = blendMap.eyeLookOutRight || 0;
  const maxLookLeft = Math.max(lookInLeft, lookOutLeft);
  const maxLookRight = Math.max(lookInRight, lookOutRight);
  const gazeValid = maxLookLeft < 0.85 && maxLookRight < 0.85;
  
  // Combine all checks
  const isOnScreen = landmarksValid && headPoseValid && gazeValid;
  
  console.log("DEBUG - Face on screen check:", {
    landmarksValid,
    headPoseValid,
    gazeValid,
    yaw: headPose.yaw,
    pitch: headPose.pitch
  });
  
  return {
    isOnScreen,
    score: isOnScreen ? 1.0 : 0.3,
    yaw: headPose.yaw,
    pitch: headPose.pitch,
    landmarksValid,
    gazeValid
  };
};

// Robust smile intensity (0-100) - ignores eye/head movement
const calculateSmileIntensity = (blendMap) => {
  const smileL = blendMap.mouthSmileLeft || 0;
  const smileR = blendMap.mouthSmileRight || 0;
  const dimplerL = blendMap.mouthDimpleLeft || 0;
  const dimplerR = blendMap.mouthDimpleRight || 0;
  
  // Only use mouth smile and dimplers (avoids false positives from eye movement)
  const rawSmile = (
    (smileL + smileR) / 2 * 0.7 + 
    (dimplerL + dimplerR) / 2 * 0.3
  );
  
  // Scale to 0-100 (robust, not too sensitive)
  const scaledSmile = Math.min(100, rawSmile * 100);
  return scaledSmile;
};

// Process face detection results with improved accuracy
export const processFaceDetection = (result, calibrationData, smoothedEmotionsRef, smoothedValenceRef, smoothedArousalRef) => {
  if (!result.faceBlendshapes?.length || !result.faceLandmarks?.length) {
    return {
      expression: "🚫 No Face Detected",
      confidence: 0,
      valence: 0.95 * smoothedValenceRef.current,
      arousal: 0.95 * smoothedArousalRef.current,
      activeBlendshapes: {},
      landmarks: null,
      smileIntensity: 0,
      eyesOpen: { isOpen: true, score: 1, leftBlink: 0, rightBlink: 0 },
      eyesOnScreen: { isOnScreen: true, score: 1, lookScore: 1, symmetryScore: 1 }
    };
  }

  const landmarks = result.faceLandmarks[0];
  const blendMap = Object.fromEntries(
    result.faceBlendshapes[0].categories.map((item) => [
      item.categoryName,
      item.score,
    ])
  );

  // Calibrated score function with improved baseline handling
  const score = (name) => {
    const raw = blendMap[name] ?? 0;
    if (!calibrationData) return raw;
    const baseline = calibrationData[name] ?? 0;
    return Math.max(0, Math.min(1, (raw - baseline) / Math.max(0.005, 1.0 - baseline)));
  };

  // Enhanced FACS-inspired expression formulas
  const smileL = score("mouthSmileLeft");
  const smileR = score("mouthSmileRight");
  const smile = (smileL + smileR) / 2;
  const smileDiff = Math.abs(smileL - smileR);

  const frown = (score("mouthFrownLeft") + score("mouthFrownRight")) / 2;
  const jawOpen = score("jawOpen");
  const browInnerUp = score("browInnerUp");
  const browDown = (score("browDownLeft") + score("browDownRight")) / 2;
  const eyeBlink = (score("eyeBlinkLeft") + score("eyeBlinkRight")) / 2;
  const eyeWide = (score("eyeWideLeft") + score("eyeWideRight")) / 2;
  const cheekSquint = (score("cheekSquintLeft") + score("cheekSquintRight")) / 2;
  const mouthPress = (score("mouthPressLeft") + score("mouthPressRight")) / 2;
  const mouthPucker = score("mouthPucker");
  const mouthShrugUpper = score("mouthShrugUpper");
  const mouthShrugLower = score("mouthShrugLower");
  const noseSneer = (score("noseSneerLeft") + score("noseSneerRight")) / 2;
  const mouthStretch = (score("mouthStretchLeft") + score("mouthStretchRight")) / 2;
  const dimpler = (score("mouthDimpleLeft") + score("mouthDimpleRight")) / 2;
  const browLeftUp = score("browOuterUpLeft");
  const browRightUp = score("browOuterUpRight");
  const browDiff = Math.abs(browLeftUp - browRightUp);
  const mouthUpperUp = score("mouthUpperUpLeft") + score("mouthUpperUpRight");
  const eyeSquint = (score("eyeSquintLeft") + score("eyeSquintRight")) / 2;

  // Detailed blendshapes telemetry mapping
  const activeBlendshapes = {
    "Smile": smile,
    "Frown": frown,
    "Jaw Open": jawOpen,
    "Eyebrows Up": browInnerUp,
    "Eyebrows Down": browDown,
    "Eyes Wide": eyeWide,
    "Cheeks Squint": cheekSquint,
    "Nose Wrinkle": noseSneer,
    "Mouth Press": mouthPress,
    "Mouth Pucker": mouthPucker
  };

  // 1. Genuine Happy (Duchenne) - enhanced with squint and smile combination
  const genuineHappy = smile * 0.55 + cheekSquint * 0.35 + mouthUpperUp * 0.1;

  // 2. Excited - improved with multiple cues
  const excited = (smile > 0.15 && jawOpen > 0.05) ? (smile * 0.35 + jawOpen * 0.35 + browInnerUp * 0.2 + eyeWide * 0.1) : 0;

  // 3. Surprised - more sensitive
  const surprised = browInnerUp * 0.3 + eyeWide * 0.35 + jawOpen * 0.3 + mouthShrugUpper * 0.05;

  // 4. Sadness - improved with better suppression
  let sadness = frown * 0.45 + browInnerUp * 0.3 + mouthShrugLower * 0.25;
  sadness *= Math.max(0, 1 - smile * 1.8);

  // 5. Anger - more accurate
  let anger = browDown * 0.45 + noseSneer * 0.3 + mouthPress * 0.25;
  anger *= Math.max(0, 1 - smile * 1.8);

  // 6. Disgust - enhanced with more blendshapes
  let disgust = noseSneer * 0.45 + mouthShrugUpper * 0.3 + score("mouthRollLower") * 0.15 + eyeSquint * 0.1;
  disgust *= Math.max(0, 1 - smile * 1.8);

  // 7. Fear - improved
  let fear = browInnerUp * 0.25 + eyeWide * 0.35 + mouthStretch * 0.3 + mouthShrugUpper * 0.1;
  fear *= Math.max(0, 1 - smile * 1.8);

  // 8. Kiss / Pucker
  const kiss = mouthPucker * 0.75 + mouthPress * 0.25;

  // 9. Winking / Smirking / Contempt
  const smirk = (smileDiff > 0.1 && dimpler > 0.07) ? (smileDiff * 0.6 + dimpler * 0.4) : 0;

  // 10. Thinking / Skeptical
  const thinking = (browDiff > 0.25 || mouthPress > 0.3) ? ((browDiff * 0.5) + (mouthPress * 0.3) + (score("eyeLookDownLeft") + score("eyeLookDownRight")) * 0.2) : 0;

  // 11. Bored / Tired - more sensitive
  const bored = (eyeBlink > 0.35 && eyeBlink < 0.85) ? (eyeBlink * 0.65 + (1 - (smile + frown + jawOpen + browInnerUp)) * 0.35) : 0;

  // 12. Eyes Closed / Sleeping
  const eyesClosed = eyeBlink >= 0.85 ? eyeBlink : 0;

  const rawEmotions = {
    "Eyes Closed": { score: eyesClosed, threshold: 0.85, label: "😴 Eyes Closed" },
    "Kiss / Pucker": { score: kiss, threshold: 0.4, label: "😘 Kiss / Pucker" },
    "Winking / Smirking": { score: smirk, threshold: 0.2, label: "😏 Smirk / Contempt" },
    "Excited": { score: excited, threshold: 0.25, label: "🤩 Excited" },
    "Genuine Happy": { score: genuineHappy, threshold: 0.1, label: "😊 Happy" },
    "Surprised": { score: surprised, threshold: 0.3, label: "😲 Surprised" },
    "Sadness": { score: sadness, threshold: 0.2, label: "😢 Sadness" },
    "Anger": { score: anger, threshold: 0.25, label: "😠 Anger" },
    "Disgust": { score: disgust, threshold: 0.3, label: "🤢 Disgust" },
    "Fear": { score: fear, threshold: 0.25, label: "😨 Fear" },
    "Thinking / Skeptical": { score: thinking, threshold: 0.25, label: "🤔 Skeptical" },
    "Bored / Tired": { score: bored, threshold: 0.3, label: "🥱 Bored / Tired" }
  };

  // Smooth scores using EMA - slightly slower for stability
  const alpha = 0.15;
  let selectedEmotion = null;
  let maxVal = -1;

  Object.keys(rawEmotions).forEach(key => {
    const prev = smoothedEmotionsRef.current[key] ?? 0;
    const curr = rawEmotions[key].score;
    const smoothed = alpha * curr + (1 - alpha) * prev;
    smoothedEmotionsRef.current[key] = smoothed;

    if (smoothed >= rawEmotions[key].threshold && smoothed > maxVal) {
      maxVal = smoothed;
      selectedEmotion = { key, label: rawEmotions[key].label, val: smoothed };
    }
  });

  // Compute Valence and Arousal targets
  let targetX = 0;
  let targetY = 0;
  let expression, confidence;

  if (selectedEmotion) {
    const coord = EMOTION_COORDINATES[selectedEmotion.key] ?? { x: 0, y: 0 };
    targetX = coord.x * selectedEmotion.val;
    targetY = coord.y * selectedEmotion.val;
    expression = selectedEmotion.label;
    confidence = selectedEmotion.val;
  } else {
    const highestScore = Math.max(...Object.values(smoothedEmotionsRef.current));
    expression = "😐 Neutral";
    confidence = Math.max(0, 1 - highestScore);
    targetX = 0;
    targetY = 0;
  }

  // Smooth Valence & Arousal
  smoothedValenceRef.current = alpha * targetX + (1 - alpha) * smoothedValenceRef.current;
  smoothedArousalRef.current = alpha * targetY + (1 - alpha) * smoothedArousalRef.current;

  // Calculate additional features
  const smileIntensity = calculateSmileIntensity(blendMap);
  const eyesOpenResult = checkEyesOpen(blendMap);
  const transformationMatrix = result.faceTransformationMatrixes?.[0];
  const eyesOnScreenResult = checkEyesOnScreen(blendMap, landmarks, transformationMatrix);

  return {
    expression,
    confidence,
    valence: smoothedValenceRef.current,
    arousal: smoothedArousalRef.current,
    activeBlendshapes,
    landmarks,
    smileIntensity,
    eyesOpen: eyesOpenResult,
    eyesOnScreen: eyesOnScreenResult
  };
};
