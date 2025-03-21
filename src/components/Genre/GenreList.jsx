import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const GenreList = ({ genres }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(genres).map(([genre, description], index) => (
        <GenreCard
          key={genre}
          genre={genre}
          description={description}
          index={index}
        />
      ))}
    </div>
  );
};

const GenreCard = ({ genre, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <Link to={`/genre/${genre.toLowerCase()}`} className="block group">
      <div
        className="relative h-52 rounded-2xl overflow-hidden bg-gray-800/50 
        backdrop-blur-sm border border-gray-700/50 hover:border-[#FF009F]/50 
        transition-all duration-500 hover:shadow-xl hover:shadow-[#FF009F]/10"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#FF009F]/20 to-transparent opacity-0 
          group-hover:opacity-100 transition-opacity duration-500"
        />

        <div className="relative h-full p-6 flex flex-col justify-between">
          <div>
            <h3
              className="text-xl font-bold text-white group-hover:text-[#FF009F] 
              transition-colors duration-300 mb-3"
            >
              {genre}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
              {description}
            </p>
          </div>

          <motion.div
            className="flex items-center text-[#FF009F] text-sm font-medium mt-4"
            whileHover={{ x: 5 }}
          >
            Browse {genre} Movies
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </Link>
  </motion.div>
);

export default GenreList;
