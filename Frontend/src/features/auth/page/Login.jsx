import React, { useState, useRef, useEffect } from "react";
import "../styles/Login.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import gsap from "gsap";
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
    setWrongEntry(false);

    try {
      await handleLogin({ identifier, password });
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed. Please try again.");
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
        
        <h1>Sign In</h1>
        
        {error && <div className="alert">{error}</div>}

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
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <label className="form-label">Email or Username</label>
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

        <button type="submit" disabled={loading} className="btn">
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account?
        <Link to="/register">Sign Up</Link>
      </div>
    </div>
  );
}

export default Login;
