import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Trophy, ArrowRight, Home, Sparkles } from "lucide-react";
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

  const sparkVariants = {
    initial: { opacity: 0, scale: 0, y: 40, rotate: 0 },
    animate: (i) => ({
      opacity: [0, 1, 0],
      scale: [0, 1, 0.5],
      y: 0,
      rotate: [0, 20, -20, 0],
      transition: {
        delay: i * 0.2,
        duration: 2 + i * 0.3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0.5
      }
    })
  };

  return (
    <div className="level-complete-page">
      {/* Animated sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="sparkle"
          custom={i}
          variants={sparkVariants}
          initial="initial"
          animate="animate"
          style={{
            left: `${10 + i * 12}%`,
            top: `${10 + (i % 4) * 18}%`,
          }}
        >
          <Sparkles size={24 + i * 4} />
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
            <Trophy size={80} strokeWidth={1.5} />
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
              <ArrowRight size={22} />
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
                <Home size={22} />
                Home
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
