import React, { useState, useRef, useEffect } from "react";
import "../styles/Register.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck, VideoOff } from "lucide-react";

function Register() {
  const { loading, handleRegister, handleVerifyRegisterOtp, handleGoogleAuth, handleGuestLogin } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormUp, setIsFormUp] = useState(false);
  const [wrongEntry, setWrongEntry] = useState(false);

  const containerRef = useRef(null);
  const eyeBallLeftRef = useRef(null);
  const eyeBallRightRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const dw = window.innerWidth / 15;
      const dh = window.innerHeight / 15;
      const x = event.pageX / dw;
      const y = event.pageY / dh;
      
      if (eyeBallLeftRef.current) {
        eyeBallLeftRef.current.style.width = `${x}px`;
        eyeBallLeftRef.current.style.height = `${y}px`;
      }
      if (eyeBallRightRef.current) {
        eyeBallRightRef.current.style.width = `${x}px`;
        eyeBallRightRef.current.style.height = `${y}px`;
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setWrongEntry(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setWrongEntry(true);
      setTimeout(() => setWrongEntry(false), 3000);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setWrongEntry(true);
      setTimeout(() => setWrongEntry(false), 3000);
      return;
    }

    try {
      if (verificationSent) {
        await handleVerifyRegisterOtp({ email, otp });
        navigate("/");
        return;
      }

      const data = await handleRegister({ username, email, password });
      setVerificationSent(true);
      setOtp(data?.devOtp || "");
      setNotice(data?.message || "Verification code sent to your email");
    } catch (err) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
      setWrongEntry(true);
      setTimeout(() => setWrongEntry(false), 3000);
    }
  }

  const onGoogleSuccess = async (credentialResponse) => {
    try {
      await handleGoogleAuth(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Google login failed. Please try again.");
      setWrongEntry(true);
      setTimeout(() => setWrongEntry(false), 3000);
    }
  };

  async function handleResendOtp() {
    setError("");
    setNotice("");
    setWrongEntry(false);

    try {
      const data = await handleRegister({ username, email, password });
      setOtp(data?.devOtp || "");
      setNotice(data?.message || "Verification code sent again");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not resend code. Please try again.");
      setWrongEntry(true);
      setTimeout(() => setWrongEntry(false), 3000);
    }
  }

  const handleTryGuest = () => {
    handleGuestLogin();
    navigate("/");
  };

  return (
    <div className="auth-container" ref={containerRef}>
      <button className="back-button" onClick={() => navigate("/")}>
        <ArrowLeft size={20} />
      </button>

      <div className="panda">
        <div className="ear"></div>
        <div className="face">
          <div className="eye-shade"></div>
          <div className="eye-white">
            <div className="eye-ball" ref={eyeBallLeftRef}></div>
          </div>
          <div className="eye-shade rgt"></div>
          <div className="eye-white rgt">
            <div className="eye-ball" ref={eyeBallRightRef}></div>
          </div>
          <div className="nose"></div>
          <div className="mouth"></div>
        </div>
        <div className="body"> </div>
        <div className="foot">
          <div className="finger"></div>
        </div>
        <div className="foot rgt">
          <div className="finger"></div>
        </div>
      </div>
      
      <form className={`auth-form ${isFormUp ? 'up' : ''} ${wrongEntry ? 'wrong-entry' : ''}`} ref={formRef} onSubmit={handleSubmit}>
        <div className="hand"></div>
        <div className="hand rgt"></div>
        
        <h1>{verificationSent ? "Verify Email" : "Register"}</h1>

        {!verificationSent && (
          <>
            <div className="trust-badges" aria-label="Account privacy and security notes">
              <div className="trust-badge">
                <ShieldCheck size={16} />
                <span>Google verified sign-in</span>
              </div>
              <div className="trust-badge">
                <KeyRound size={16} />
                <span>Email code verification</span>
              </div>
              <div className="trust-badge">
                <VideoOff size={16} />
                <span>No camera in demo mode</span>
              </div>
            </div>

            <p className="auth-trust-note">
              Register with Google or email. Your password is protected, and camera access is requested only when you play.
            </p>

            <button
              type="button"
              className="btn-guest-continue"
              onClick={handleContinueGuest}
            >
              <Sparkles size={18} />
              Continue Without Registration
            </button>

            <div className="auth-divider">
              <div />
              <span>or create account</span>
              <div />
            </div>
          </>
        )}
        
        {error && <div className="alert">{error}</div>}
        {notice && <p className="auth-notice">{notice}</p>}

        {!verificationSent ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={() => {
                  setError("Google login failed. Please try again.");
                  setWrongEntry(true);
                  setTimeout(() => setWrongEntry(false), 3000);
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem", color: "#aaa" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }} />
              <span style={{ padding: "0 1rem" }}>or</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }} />
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label className="form-label">Username</label>
            </div>

            <div className="form-group">
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label className="form-label">Email Address</label>
            </div>

            <div className="form-group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFormUp(true)}
                onBlur={() => setIsFormUp(false)}
                required
              />
              <label className="form-label">Password</label>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="form-group">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setIsFormUp(true)}
                onBlur={() => setIsFormUp(false)}
                required
              />
              <label className="form-label">Confirm Password</label>
              <button
                type="button"
                className="password-toggle confirm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="otp-help">Enter the 6-digit code sent to {email}</p>
            <div className="form-group">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength="6"
                className="form-control otp-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
              <label className="form-label">Verification Code</label>
            </div>
            <button type="button" className="resend-btn" onClick={handleResendOtp} disabled={loading}>
              Resend code
            </button>
          </>
        )}

        <button type="submit" disabled={loading} className="btn">
          {loading ? "Please wait..." : verificationSent ? "Verify & Join" : "Send Code"}
        </button>

        {!verificationSent && (
          <div className="privacy-note">
            Prefer privacy? <button type="button" className="privacy-note-link" onClick={handleTryGuest}>Try as Guest</button>.
            Guests can preview the UI and view the leaderboard only.
          </div>
        )}
      </form>

      <div className="auth-footer">
        Already have an account?
        <Link to="/login">Sign In</Link>
      </div>
    </div>
  );
}

export default Register;
