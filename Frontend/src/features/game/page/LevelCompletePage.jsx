import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Trophy, ArrowRight, Home } from "lucide-react";
import "../styles/LevelCompletePage.scss";

export default function LevelCompletePage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    // GSAP container animation
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.9, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 1, ease: "back.out(1.5)" }
    );
  }, []);

  const confettiVariants = {
    initial: { opacity: 0, scale: 0, y: 100, rotate: 0 },
    animate: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: [0, 10, -10, 0],
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: "back.out(2)",
        y: {
          repeat: Infinity,
          yoyo: true,
          duration: 2 + i * 0.5,
          ease: "sine.inOut"
        }
      }
    })
  };

  const confettiEmojis = ["🎉", "✨", "🏆", "💫", "⭐", "🎊"];

  return (
    <div className="level-complete-page">
      {/* Animated gradient background */}
      <div className="animated-gradient-bg" />
      
      {/* Confetti */}
      {confettiEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="confetti"
          custom={i}
          variants={confettiVariants}
          initial="initial"
          animate="animate"
          style={{
            left: `${10 + i * 15}%`,
            top: `${10 + (i % 3) * 20}%`,
            fontSize: `${2 + i * 0.5}rem`
          }}
        >
          {emoji}
        </motion.div>
      ))}

      <div className="level-complete-container">
        <motion.div
          ref={containerRef}
          className="level-complete-content glass-card"
        >
          <motion.div
            className="trophy-icon"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Trophy size={80} />
          </motion.div>
          
          <h1 className="level-complete-title gradient-text">
            Level Complete!
          </h1>
          
          <p className="tagline">
            Keep a Straight Face or Lose It All
          </p>

          <div className="level-complete-buttons">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="next-level-btn btn-primary"
              onClick={() => navigate("/game")}
            >
              <ArrowRight size={24} />
              Next Level
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
