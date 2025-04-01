import React, { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

const FadeInSection = ({
  children,
  delay = 0,
  duration = 0.5,
  direction = "up",
  threshold = 0.1,
  distance = 50,
  className = "",
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold });
  const controls = useAnimation();

  // Calculate direction-based animation values
  const getDirectionAnimation = () => {
    const animations = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
      none: {},
    };
    return animations[direction] || animations.up;
  };

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const variants = {
    hidden: {
      opacity: 0,
      ...getDirectionAnimation(),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Cubic bezier for smooth animation
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Compound component for creating staggered children animations
FadeInSection.Group = ({
  children,
  staggerDelay = 0.1,
  className = "",
  containerDelay = 0,
  staggerDirection = 1, // 1 for forward, -1 for reverse
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: containerDelay,
        staggerChildren: staggerDelay,
        staggerDirection,
        delayChildren: containerDelay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Item component for use within staggered groups
FadeInSection.Item = ({
  children,
  className = "",
  direction = "up",
  distance = 20,
  duration = 0.5,
}) => {
  // Calculate direction-based animation values
  const getDirectionAnimation = () => {
    const animations = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
      none: {},
    };
    return animations[direction] || animations.up;
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      ...getDirectionAnimation(),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

export default FadeInSection;
