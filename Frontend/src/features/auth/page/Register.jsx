import React, { useState, useRef, useEffect } from "react";
import "../styles/Register.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import gsap from "gsap";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

function Register() {
  const { loading, handleRegister } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      .fromTo(formRef.current.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, "-=0.3")
      .fromTo(footerRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.25");
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    gsap.to(cardRef.current, { scale: 0.985, duration: 0.1, yoyo: true, repeat: 1 });

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      gsap.to(cardRef.current, { x: -8, duration: 0.1, repeat: 3, yoyo: true, ease: "power2.inOut" });
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      gsap.to(cardRef.current, { x: -8, duration: 0.1, repeat: 3, yoyo: true, ease: "power2.inOut" });
      return;
    }

    try {
      await handleRegister({ username, email, password });

      gsap.to(cardRef.current, {
        scale: 1.05,
        opacity: 0,
        duration: 0.5,
        ease: "back.in(1.7)",
        onComplete: () => navigate("/")
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
      gsap.to(cardRef.current, { x: -8, duration: 0.1, repeat: 3, yoyo: true, ease: "power2.inOut" });
    }
  }

  return (
    <div className="auth-container" ref={containerRef}>
      <div className="auth-card" ref={cardRef}>
        <button className="back-button" onClick={() => navigate("/")}>
          <ArrowLeft size={20} />
        </button>

        <div className="auth-header" ref={headerRef}>
          <p className="auth-label">Get started</p>
          <h1>Create Account</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" ref={formRef} onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer" ref={footerRef}>
          Already have an account?
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
