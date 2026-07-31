import React, { useState, useRef, useEffect } from "react";
import "../styles/Login.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

function Login() {
  const { loading, handleLogin, handleGoogleAuth } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFormUp, setIsFormUp] = useState(false);
  const [wrongEntry, setWrongEntry] = useState(false);

  const containerRef = useRef(null);
  const eyeBallLeftRef = useRef(null);
  const eyeBallRightRef = useRef(null);
  const formRef = useRef(null);
  const wrongEntryTimerRef = useRef(null);

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
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (wrongEntryTimerRef.current) {
        window.clearTimeout(wrongEntryTimerRef.current);
      }
    };
  }, []);

  const showEntryError = () => {
    setWrongEntry(true);
    if (wrongEntryTimerRef.current) {
      window.clearTimeout(wrongEntryTimerRef.current);
    }
    wrongEntryTimerRef.current = window.setTimeout(() => {
      setWrongEntry(false);
      wrongEntryTimerRef.current = null;
    }, 3000);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setWrongEntry(false);

    try {
      await handleLogin({ identifier, password });
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed. Please try again.");
      showEntryError();
    }
  }

  const onGoogleSuccess = async (credentialResponse) => {
    try {
      await handleGoogleAuth(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Google login failed. Please try again.");
      showEntryError();
    }
  };

  return (
    <div className="auth-container" ref={containerRef}>
      <button className="back-button" onClick={() => navigate("/")} aria-label="Back to home">
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
        
        <h1>Sign In</h1>
        
        {error && <div className="alert">{error}</div>}

        <div className="google-login-wrap">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => {
              setError("Google login failed. Please try again.");
              showEntryError();
            }}
          />
        </div>

        <div className="auth-divider">
          <div />
          <span>or</span>
          <div />
        </div>

        <div className="form-group">
          <input
            id="identifier"
            type="text"
            className="form-control"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <label className="form-label" htmlFor="identifier">Email or Username</label>
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
          <label className="form-label" htmlFor="password">Password</label>
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn">
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="privacy-note">
          If you don’t want to share personal data, use demo login:
          <span className="privacy-note-cred"> demo</span>
          <span className="privacy-note-sep"> / </span>
          <span className="privacy-note-cred">123456</span>. We respect your privacy.
        </div>
      </form>

      <div className="auth-footer">
        Don't have an account?
        <Link to="/register">Sign Up</Link>
      </div>
    </div>
  );
}

export default Login;
