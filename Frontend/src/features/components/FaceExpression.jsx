import React from "react";
import { useFaceDetection } from "../Expression/utils/useFaceDetection";
import "../Expression/styles/faceExpression.scss";

export default function FaceExpression({ className = "", onDetectionUpdate }) {
  const {
    videoRef,
    canvasRef,
    isCalibrating,
    calibrationCountdown,
    cameraActive,
    loadingModel,
    smileIntensity,
    eyesOpen,
    eyesOnScreen,
    faceDetected
  } = useFaceDetection();

  // Call onDetectionUpdate whenever any detection state changes
  React.useEffect(() => {
    if (onDetectionUpdate) {
      onDetectionUpdate({
        smileIntensity,
        eyesOpen,
        eyesOnScreen,
        faceDetected,
        cameraActive,
        loadingModel
      });
    }
  }, [
    smileIntensity,
    eyesOpen,
    eyesOnScreen,
    faceDetected,
    cameraActive,
    loadingModel,
    onDetectionUpdate
  ]);

  return (
    <div className={className}>
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
            <p className="loader-text">Loading AI...</p>
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
      
      {/* Optional calibration button for parent to use if needed, but we can also expose startCalibration */}
    </div>
  );
}
