import React, { useState, useRef, useEffect } from "react";
import "../styles/Login.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import gsap from "gsap";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

function Login() {
  const { loading, handleLogin } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 })
      .fromTo(cardRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, "-=0.3")
      .fromTo(headerRef.current, { y: -15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.4")
      .fromTo(formRef.current.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.12 }, "-=0.3")
      .fromTo(footerRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.25");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    gsap.to(cardRef.current, { scale: 0.985, duration: 0.1, yoyo: true, repeat: 1 });

    try {
      await handleLogin({ identifier, password });

      gsap.to(cardRef.current, {
        scale: 1.05,
        opacity: 0,
        duration: 0.5,
        ease: "back.in(1.7)",
        onComplete: () => navigate("/")
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed. Please try again.");

      gsap.to(cardRef.current, {
        x: -8,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  }

  return (
    <div className="auth-container" ref={containerRef}>
      <div className="auth-card" ref={cardRef}>
        <button className="back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={20} />
        </button>

        <div className="auth-header" ref={headerRef}>
          <p className="auth-label">Welcome back</p>
          <h1>Sign In</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" ref={formRef} onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email or Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer" ref={footerRef}>
          Don't have an account?
          <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
