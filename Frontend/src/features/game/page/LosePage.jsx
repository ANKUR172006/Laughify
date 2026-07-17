import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { RotateCcw, Home } from "lucide-react";
import "../styles/LosePage.scss";

export default function LosePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reason = location.state?.reason || "unknown";
  const containerRef = useRef(null);

  const getReasonContent = () => {
    switch (reason) {
      case "smile":
        return {
          emoji: "😂",
          title: "You Smiled!",
          text: "You couldn't keep a straight face! A smile or laugh means game over!"
        };
      case "eyes-closed":
        return {
          emoji: "😴",
          title: "Eyes Closed Too Long!",
          text: "Your eyes were closed for over 2 seconds! Keep them on the screen!"
        };
      case "face-away":
        return {
          emoji: "🙈",
          title: "Where'd You Go?",
          text: "Your face was not in the camera view for too long! Stay in the frame!"
        };
      default:
        return {
          emoji: "😞",
          title: "Oops!",
          text: "Something went wrong! Let's try again!"
        };
    }
  };

  const content = getReasonContent();

  useEffect(() => {
    // GSAP container animation
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.9, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 1, ease: "back.out(1.5)" }
    );
  }, []);

  return (
    <div className="lose-page">
      {/* Animated gradient background */}
      <div className="animated-gradient-bg" />
      
      <div className="lose-container">
        <motion.div
          ref={containerRef}
          className="lose-content glass-card"
        >
          <motion.div
            className="lose-emoji"
            animate={{
              y: [0, -20, 0],
              rotate: [0, -5, 5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {content.emoji}
          </motion.div>
          
          <h1 className="lose-title gradient-text">
            {content.title}
          </h1>
          
          <p className="lose-text">
            {content.text}
          </p>

          <div className="tagline" style={{ marginTop: "24px" }}>
            Keep a Straight Face or Lose It All
          </div>

          <div className="lose-actions">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="retry-btn btn-primary" 
              onClick={() => navigate("/game")}
            >
              <RotateCcw size={24} />
              Try Again
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                to="/" 
                className="home-btn btn-secondary"
              >
                <Home size={24} />
                Home
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
