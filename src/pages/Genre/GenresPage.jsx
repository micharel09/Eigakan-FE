import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Film, ChevronRight } from "lucide-react";
import GenreList from "../../components/Genre/GenreList";
import genreService from "../../apis/Genre/genre";
import { useState, useEffect } from "react";
import { Spin } from "antd";

export default function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true);
        const response = await genreService.getGenres();
        if (response.data) {
          // Tạo object descriptions từ API data
          const descriptions = response.data.reduce(
            (acc, genre) => ({
              ...acc,
              [genre.name]:
                genre.description || getDefaultDescription(genre.name),
            }),
            {}
          );
          setGenres(descriptions);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Movie Genres - Eigakan</title>
        <meta
          name="description"
          content="Browse movies by genre on Eigakan - Find your perfect entertainment"
        />
      </Helmet>

      {/* Smaller gradient transition from navbar that won't interfere with movie pages */}
      <div className="w-full h-16 bg-gradient-to-b from-black via-black/90 to-black/70"></div>

      <div className="px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <PageHeader />
          <GenreList genres={genres} />
        </div>
      </div>
    </div>
  );
}

const PageHeader = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex items-center gap-2 mb-6">
      <Film className="w-6 h-6 text-[#FF009F]" />
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <span>Browse</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">Genres</span>
      </nav>
    </div>

    <motion.h1
      className="text-3xl md:text-4xl font-bold text-white mb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      Movie{" "}
      <motion.span
        className="text-[#FF009F]"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        Genres
      </motion.span>
    </motion.h1>

    <motion.p
      className="text-gray-400 max-w-3xl mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      Discover our extensive collection of movies across various genres. Whether
      you're in the mood for heart-pounding action, spine-chilling horror, or
      heartwarming romance, we've got you covered.
    </motion.p>

    <motion.div
      className="h-px bg-gradient-to-r from-[#FF009F]/50 via-[#FF009F]/20 to-transparent mb-12"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.8, duration: 0.8 }}
    />
  </motion.div>
);

// Helper function để tạo mô tả mặc định cho genres không có description
const getDefaultDescription = (genreName) => {
  const defaultDescriptions = {
    Action: "High-octane thrills and explosive entertainment",
    Comedy: "Laugh-out-loud moments and feel-good stories",
    Drama: "Compelling narratives and emotional journeys",
    Horror: "Spine-chilling tales and supernatural frights",
    Romance: "Love stories that touch the heart",
    "Sci-Fi": "Mind-bending adventures in future worlds",
    Adventure: "Epic journeys and exciting discoveries",
    Animation: "Creative storytelling through animated artistry",
    Documentary: "Real stories that inform and inspire",
    Fantasy: "Magical worlds and extraordinary tales",
    Mystery: "Intriguing puzzles and suspenseful revelations",
    Thriller: "Heart-pounding suspense and intense excitement",
  };

  return (
    defaultDescriptions[genreName] ||
    `Explore our collection of ${genreName} movies and discover new favorites`
  );
};
