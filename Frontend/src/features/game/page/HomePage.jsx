import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Zap, Smile, Clock, Trophy, LogOut, User } from "lucide-react";
import { useAuthContext } from "../../auth/authContext";
import { useAuth } from "../../auth/hooks/useAuth";
import "../styles/HomePage.scss";

const HomePage = () => {
  const { user } = useAuthContext();
  const { handleLogout } = useAuth();
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-5, 5]);

  const titleRef = useRef(null);
  const taglineRef = useRef(null);
  const playBtnRef = useRef(null);
  const featuresRef = useRef([]);
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const blob3Ref = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    // GSAP timeline for entrance animation
    const tl = gsap.timeline();
    
    tl.fromTo(
      navRef.current,
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    ).fromTo(
      titleRef.current,
      { opacity: 0, y: 80, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out" },
      "-=0.5"
    ).fromTo(
      taglineRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
      "-=0.5"
    ).fromTo(
      playBtnRef.current,
      { opacity: 0, scale: 0.6, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(2)" },
      "-=0.4"
    ).fromTo(
      featuresRef.current,
      { opacity: 0, y: 50, rotateX: 20 },
      { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.2, ease: "power3.out" },
      "-=0.3"
    );

    // Animate blobs
    gsap.to(blob1Ref.current, {
      x: 80,
      y: -60,
      scale: 1.2,
      duration: 7,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(blob2Ref.current, {
      x: -70,
      y: 70,
      scale: 1.1,
      duration: 9,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(blob3Ref.current, {
      x: 50,
      y: -40,
      scale: 1.15,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const newMouseX = (e.clientX - centerX) / (rect.width / 2);
    const newMouseY = (e.clientY - centerY) / (rect.height / 2);
    setMouseX(newMouseX);
    setMouseY(newMouseY);
    x.set(newMouseX);
    y.set(newMouseY);
  };

  const features = [
    {
      icon: <Zap size={48} />,
      title: "Stay Focused",
      desc: "Keep your eyes on the camera and your lids wide open"
    },
    {
      icon: <Smile size={48} />,
      title: "No Smiles",
      desc: "Even the tiniest grin will cost you the game"
    },
    {
      icon: <Clock size={48} />,
      title: "Beat the Clock",
      desc: "Survive each level and unlock new challenges"
    }
  ];

  return (
    <div className="home-page" onMouseMove={handleMouseMove}>
      {/* Animated gradient background */}
      <div className="animated-gradient-bg" />

      {/* Background blobs */}
      <motion.div
        ref={blob1Ref}
        className="bg-blob"
        style={{
          top: '-150px',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        }}
      />
      <motion.div
        ref={blob2Ref}
        className="bg-blob"
        style={{
          bottom: '-120px',
          left: '-100px',
          width: '450px',
          height: '450px',
          background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
        }}
      />
      <motion.div
        ref={blob3Ref}
        className="bg-blob"
        style={{
          top: '40%',
          right: '20%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
          opacity: 0.3
        }}
      />

      {/* Navigation */}
      <motion.nav
        ref={navRef}
        className="navbar glass-card"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "power3.out" }}
      >
        <div className="logo">
          <span className="logo-text">🎭 Laughify</span>
        </div>
        <div className="nav-right">
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                <User size={20} />
              </div>
              <span className="user-name">Hey, {user.username}!</span>
              <button className="btn-secondary" onClick={handleLogout}>
                <LogOut size={18} style={{ marginRight: '8px' }} /> Logout
              </button>
            </div>
          )}
          {!user && (
            <div className="auth-links">
              <Link to="/login" className="auth-link">Login</Link>
              <Link to="/register" className="btn-primary signup-btn">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </motion.nav>

      <div className="home-container">
        {/* Hero section */}
        <div className="hero-section">
          <motion.div
            ref={titleRef}
            className="hero-title-wrapper"
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d'
            }}
          >
            <h1 className="hero-title">
              <span className="title-gradient gradient-text">Laughify</span>
            </h1>
            <div className="hero-shine" />
          </motion.div>

          <p ref={taglineRef} className="tagline">
            Keep a Straight Face or Lose It All
          </p>

          <Link ref={playBtnRef} to="/game" className="play-btn btn-primary">
            <motion.div
              className="btn-icon-wrapper"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ marginRight: '12px' }}
            >
              <Trophy size={28} />
            </motion.div>
            Play Now
          </Link>
        </div>

        {/* Features section */}
        <div className="features-section">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              ref={(el) => (featuresRef.current[index] = el)}
              className="feature-card glass-card card-3d"
              whileHover={{
                y: -20,
                scale: 1.05,
                rotateX: 5,
                rotateY: 5
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
