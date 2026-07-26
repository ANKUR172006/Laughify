import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { RotateCcw, Home, Smile, EyeOff, UserMinus } from "lucide-react";
import "../styles/LosePage.scss";

const MotionDiv = motion.div;
const MotionButton = motion.button;

export default function LosePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reason = location.state?.reason || "unknown";
  const containerRef = useRef(null);

  const getReasonContent = () => {
    switch (reason) {
      case "smile":
        return {
          icon: <Smile size={80} strokeWidth={1.5} />,
          title: "You Smiled!",
          text: "You couldn't keep a straight face! A smile or laugh means game over!"
        };
      case "eyes-closed":
        return {
          icon: <EyeOff size={80} strokeWidth={1.5} />,
          title: "Eyes Closed Too Long!",
          text: "Your eyes were closed for over 1 second. Keep them open to survive the level."
        };
      case "face-missing":
        return {
          icon: <UserMinus size={80} strokeWidth={1.5} />,
          title: "Where'd You Go?",
          text: "Your face left the camera view. Stay in the frame until the video ends."
        };
      case "look-away":
      case "face-away":
        return {
          icon: <EyeOff size={80} strokeWidth={1.5} />,
          title: "Look at the Screen!",
          text: "You looked away from the camera. Keep your eyes on screen to win."
        };
      default:
        return {
          icon: <UserMinus size={80} strokeWidth={1.5} />,
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
      <div className="lose-container">
        <MotionDiv
          ref={containerRef}
          className="lose-content glass-card"
        >
          <MotionDiv
            className="lose-icon"
            animate={{
              y: [0, -16, 0],
              rotate: [0, -4, 4, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {content.icon}
          </MotionDiv>
          
          <h1 className="lose-title gradient-text">
            {content.title}
          </h1>
          
          <p className="lose-text">
            {content.text}
          </p>

          <div className="tagline">
            Keep a Straight Face or Lose It All
          </div>

          <div className="lose-actions">
            <MotionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="retry-btn btn-primary" 
              onClick={() => navigate("/game")}
            >
              <RotateCcw size={22} />
              Try Again
            </MotionButton>
            <MotionDiv
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
            </MotionDiv>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
}
