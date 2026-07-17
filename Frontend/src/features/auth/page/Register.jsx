import React, { useState, useRef, useEffect } from "react";
import "../styles/Register.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import gsap from "gsap";

function Register() {
  const { loading, handleRegister } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const pageRef = useRef(null);
  const cardRef = useRef(null);
  const headerRef = useRef(null);
  const formRef = useRef(null);
  const linkRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(pageRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.5 }
    )
    .fromTo(cardRef.current, 
      { y: 50, opacity: 0, rotation: -2 }, 
      { y: 0, opacity: 1, rotation: 0, duration: 0.6, ease: "back.out(1.7)" }
    )
    .fromTo(headerRef.current, 
      { y: -20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    )
    .fromTo(formRef.current.children, 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" }
    )
    .fromTo(linkRef.current, 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  }, []);

  const handleInputFocus = (e) => {
    gsap.to(e.target, {
      scale: 1.02,
      duration: 0.2,
      ease: "power2.out"
    });
  };

  const handleInputBlur = (e) => {
    gsap.to(e.target, {
      scale: 1,
      duration: 0.2,
      ease: "power2.out"
    });
  };

  const handleButtonHover = (e) => {
    gsap.to(e.target, {
      scale: 1.05,
      duration: 0.2,
      ease: "back.out(1.7)"
    });
  };

  const handleButtonLeave = (e) => {
    gsap.to(e.target, {
      scale: 1,
      duration: 0.2,
      ease: "power2.out"
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    gsap.to(cardRef.current, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    });

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      gsap.to(cardRef.current, {
        x: -10,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power2.inOut"
      });
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      gsap.to(cardRef.current, {
        x: -10,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power2.inOut"
      });
      return;
    }

    try {
      await handleRegister({
        username,
        email,
        password,
      });

      gsap.to(cardRef.current, {
        scale: 1.1,
        rotation: 5,
        opacity: 0,
        duration: 0.5,
        ease: "back.in(1.7)",
        onComplete: () => navigate("/")
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
      
      gsap.to(cardRef.current, {
        x: -10,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  }

  return (
    <div className="register-page" ref={pageRef}>
      <div className="animated-gradient-bg" />
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      
      <div className="register-card glass-card" ref={cardRef}>
        <div className="register-header" ref={headerRef}>
          <h1>Create Account</h1>
          <p>Join Laughify today</p>
        </div>

        <div className="tagline">
          Keep a Straight Face or Lose It All
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form className="register-form" ref={formRef} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            required
          />

          <button 
            type="submit" 
            disabled={loading}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="login-link" ref={linkRef}>
          Already have an account?
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
