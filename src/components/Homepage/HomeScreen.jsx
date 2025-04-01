import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import MovieList from "../../components/Homepage/MovieList";
import Slider from "../Homepage/Slider";
import FadeInSection from "./FadeInSection";
import ProductionHouse from "./ProductionHouse";

const HomeScreen = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate content loading delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const movieCategories = [
    { title: "All Movies", genre: "", showAll: true },
    { title: "New Movies", genre: "" },
    { title: "Action Movies", genre: "Action" },
    { title: "Horror Movies", genre: "Horror" },
    { title: "Romance Movies", genre: "Romance" },
    { title: "Animation Movies", genre: "Animation" },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-[#181818]"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Helmet>
        <title>Eigakan - Watch HD Movies Online</title>
        <meta
          name="description"
          content="Watch the latest movies and TV shows in HD quality on Eigakan"
        />
      </Helmet>

      {/* Hero Section */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Slider />
        </motion.div>
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#181818] to-transparent z-10"
        />
      </div>

      {/* Content Section with Parallax Effect */}
      <motion.div
        className="relative z-20 py-8 px-2 -mt-16"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(255, 0, 159, 0.03) 0%, transparent 60%)",
          backgroundSize: "100% 100%",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="container mx-auto">
          {/* Production Houses Section */}
          <FadeInSection delay={0.4} className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 px-4">
              Featured Studios
            </h2>
            <ProductionHouse />
          </FadeInSection>

          {/* Dynamic Animated Background Elements */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
            {/* Animated gradient orbs */}
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r from-[#FF009F]/5 to-[#FF6B9F]/5 blur-[100px]"
              animate={{
                x: ["-20%", "30%", "-20%"],
                y: ["0%", "25%", "0%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              style={{ top: "10%", left: "60%" }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-[100px]"
              animate={{
                x: ["10%", "-20%", "10%"],
                y: ["20%", "0%", "20%"],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              style={{ top: "40%", left: "10%" }}
            />
          </div>

          {/* Movie Lists */}
          <FadeInSection.Group staggerDelay={0.15} containerDelay={0.3}>
            {movieCategories.map(({ title, genre, showAll }, index) => (
              <FadeInSection.Item key={`${title}-${genre}`}>
                <MovieList title={title} genreName={genre} showAll={showAll} />
              </FadeInSection.Item>
            ))}
          </FadeInSection.Group>

          {/* Animated bottom gradient */}
          <motion.div
            className="w-full h-[200px] bg-gradient-to-t from-[#181818] via-[#181818]/50 to-transparent absolute bottom-0 left-0 right-0 z-[-1]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomeScreen;
