import "../styles/faceExpression.scss";
import { useAuth } from "../../auth/hooks/useAuth";
import { useFaceDetection } from "../utils/useFaceDetection";

export default function FaceExpressionPage() {
  const { user, handleLogout } = useAuth();
  const {
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
    accentColor,
    startCalibration
  } = useFaceDetection();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Moodify</h1>
          <p className="app-subtitle">Facial Expression Detection</p>
        </div>
        <div className="header-right">
          <span className="user-info">Hi {user?.username}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="main-content">
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
            onClick={startCalibration}
            disabled={isCalibrating || loadingModel || !cameraActive}
            className="calibrate-btn"
          >
            {isCalibrating ? "Calibrating..." : "Calibrate Neutral"}
          </button>

          <div className="smile-section">
            <div className="smile-bar-header">
              <span className="smile-label">Smile Intensity</span>
              <span className="smile-value">{Math.round(smileIntensity)}%</span>
            </div>
            <div className="smile-bar-container">
              <div
                className="smile-bar-fill"
                style={{
                  width: `${smileIntensity}%`,
                  background: "linear-gradient(to right, #3b82f6, #22c55e, #eab308)"
                }}
              />
            </div>
          </div>

          <div className="eyes-status-container">
            <div className={`eyes-status ${(eyesOpen?.isOpen ?? true) ? "good" : "bad"}`}>
              <span className="eyes-icon">{(eyesOpen?.isOpen ?? true) ? "Open" : "Closed"}</span>
              <div className="eyes-status-content">
                <span className="eyes-text">
                  {(eyesOpen?.isOpen ?? true) ? "Eyes Open" : "Open your eyes!"}
                </span>
                <div className="eyes-score-bar">
                  <div
                    className="eyes-score-fill"
                    style={{
                      width: `${(eyesOpen?.score ?? 1) * 100}%`,
                      backgroundColor: (eyesOpen?.isOpen ?? true) ? "#22c55e" : "#ef4444"
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={`eyes-status ${(eyesOnScreen?.isOnScreen ?? true) ? "good" : "bad"}`}>
              <span className="eyes-icon">{(eyesOnScreen?.isOnScreen ?? true) ? "Focus" : "Away"}</span>
              <div className="eyes-status-content">
                <span className="eyes-text">
                  {(eyesOnScreen?.isOnScreen ?? true) ? "Eyes on Camera" : "Look at the camera!"}
                </span>
                <div className="eyes-score-bar">
                  <div
                    className="eyes-score-fill"
                    style={{
                      width: `${(eyesOnScreen?.score ?? 1) * 100}%`,
                      backgroundColor: (eyesOnScreen?.isOnScreen ?? true) ? "#22c55e" : "#ef4444"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="data-section">
          <div className="data-card">
            <p className="data-label">Detected Expression</p>
            <h2 className="expression-display" style={{ color: accentColor }}>
              {expression}
            </h2>
          </div>

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
