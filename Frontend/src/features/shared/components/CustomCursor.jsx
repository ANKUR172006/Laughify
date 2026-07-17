import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import gsap from 'gsap';
import '../styles/CustomCursor.scss';

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const trailRefs = useRef([]);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 30, stiffness: 600 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      cursorX.set(clientX);
      cursorY.set(clientY);
      
      // Move the trail
      trailRefs.current.forEach((trail, index) => {
        gsap.to(trail, {
          x: clientX,
          y: clientY,
          duration: 0.25 + (index * 0.1),
          ease: 'power2.out'
        });
      });
    };

    const handleMouseEnterInteractive = () => {
      gsap.to(cursorRef.current, {
        scale: 2,
        duration: 0.3,
        ease: 'back.out(2)'
      });
    };

    const handleMouseLeaveInteractive = () => {
      gsap.to(cursorRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Get all interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, [data-interactive="true"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnterInteractive);
      el.addEventListener('mouseleave', handleMouseLeaveInteractive);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnterInteractive);
        el.removeEventListener('mouseleave', handleMouseLeaveInteractive);
      });
    };
  }, []);

  return (
    <div className="cursor-container">
      <motion.div
        ref={cursorRef}
        className="custom-cursor"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%'
        }}
      />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <motion.div
          key={i}
          ref={el => (trailRefs.current[i] = el)}
          className="cursor-trail"
          style={{
            zIndex: 9999 - i - 1,
            opacity: 0.6 - (i * 0.06),
            scale: 1 - (i * 0.08)
          }}
        />
      ))}
    </div>
  );
};

export default CustomCursor;
