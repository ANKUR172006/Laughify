import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { motion } from "framer-motion";
import { Clock, LogOut, MessageSquareHeart, Smile, User, Zap } from "lucide-react";
import { useAuthContext } from "../../auth/authContext";
import { useAuth } from "../../auth/hooks/useAuth";
import "../styles/HomePage.scss";
import InteractiveText from "../../shared/components/InteractiveText";
import FeedbackModal from "../../shared/components/FeedbackModal";

const HomePage = () => {
  const { user } = useAuthContext();
  const { handleLogout } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackOpenCount, setFeedbackOpenCount] = useState(0);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const playBtnRef = useRef(null);
  const navRef = useRef(null);
  const featuresRef = useRef([]);
  const interactiveRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      navRef.current,
      { opacity: 0, y: -40 },
      { opacity: 1, y: 0, duration: 0.8 }
    )
      .fromTo(
        titleRef.current,
        { opacity: 0, y: 60, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2 },
        "-=0.5"
      )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9 },
        "-=0.5"
      )
      .fromTo(
        playBtnRef.current,
        { opacity: 0, y: 25, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8 },
        "-=0.4"
      )
      .fromTo(
        featuresRef.current,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.15 },
        "-=0.3"
      )
      .fromTo(
        interactiveRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1 },
        "-=0.2"
      );
  }, []);

  const openFeedback = useCallback(() => {
    setFeedbackOpenCount((n) => n + 1);
    setFeedbackOpen(true);
  }, []);

  const features = [
    {
      icon: <Zap size={56} strokeWidth={1.5} />,
      title: "Stay Focused",
      description: "Keep your eyes on the camera, no distractions allowed"
    },
    {
      icon: <Smile size={56} strokeWidth={1.5} />,
      title: "No Grins",
      description: "Even the tiniest smile will end your run"
    },
    {
      icon: <Clock size={56} strokeWidth={1.5} />,
      title: "Beat The Clock",
      description: "Survive each level and climb the leaderboard"
    }
  ];

  return (
    <div className="homepage-container" ref={containerRef}>
      {/* Navigation */}
      <motion.nav className="navbar" ref={navRef}>
        <div className="nav-inner">
          <div className="logo">
            <span className="logo-text">LAUGHIFY</span>
          </div>
          <div className="nav-actions">
            {user ? (
              <div className="user-section">
                <Link to="/profile" className="nav-link">Profile</Link>
                <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                <Link to="/love-wall" className="nav-link">Love Wall</Link>
                <button
                  className="btn-nav btn-feedback"
                  onClick={openFeedback}
                  title="Share your feedback!"
                >
                  <MessageSquareHeart size={18} />
                </button>
                <div className="user-info">
                  <div className="avatar">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.username || "Profile"} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <span className="username">{user.username}</span>
                </div>
                <button className="btn-nav" onClick={handleLogout}>
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="auth-section">
                <button
                  className="btn-nav btn-feedback"
                  onClick={openFeedback}
                  title="Share your feedback!"
                >
                  <MessageSquareHeart size={18} />
                </button>
                <Link to="/love-wall" className="nav-link">Love Wall</Link>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn-nav btn-nav-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero */}
        <section className="hero">
          <h1 className="hero-title" ref={titleRef}>
            <span className="gradient-text">LAUGHIFY</span>
          </h1>
          <p className="hero-subtitle" ref={subtitleRef}>
            We bring smile on your faces
          </p>
          <p className="hero-subtitle-secondary">
            Keep a straight face or lose it all
          </p>
          <Link ref={playBtnRef} to="/game" className="play-button">
            <span>▶︎ Play</span>
          </Link>
        </section>

        {/* Squiggly SVG Filters */}
        <svg className="squiggly-svg" aria-hidden="true">
          <defs>
            <filter id="squiggly-0">
              <feTurbulence baseFrequency="0.01" numOctaves="3" result="noise" seed="0" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
            <filter id="squiggly-1">
              <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="1" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
            <filter id="squiggly-2">
              <feTurbulence baseFrequency="0.01" numOctaves="3" result="noise" seed="2" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
            <filter id="squiggly-3">
              <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="3" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
            <filter id="squiggly-4">
              <feTurbulence baseFrequency="0.01" numOctaves="3" result="noise" seed="4" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
          </defs>
        </svg>

        {/* Features */}
        <section className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              ref={(el) => (featuresRef.current[index] = el)}
              className="feature-card"
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </motion.div>
          ))}
        </section>

        {/* Interactive Text */}
        <section className="interactive-section" ref={interactiveRef}>
          <InteractiveText />
        </section>
      </main>

      <FeedbackModal
        key={feedbackOpenCount}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        user={user}
      />
    </div>
  );
};

export default HomePage;
