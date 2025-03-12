import React from "react";
import { Helmet } from "react-helmet";
import GenreList from "../../components/Genre/GenreList";
import Navbar from "../../components/Header/Navbar";

const GenresPage = () => {
  return (
    <div className="min-h-screen bg-[#181818]">
      <Helmet>
        <title>Movie Genres - Eigakan</title>
      </Helmet>

      <div className="pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Movie <span className="text-[#FF009F]">Genres</span>
          </h1>
          <p className="text-gray-400 max-w-3xl mb-8">
            Browse our collection of movies by genre. Find the perfect movie for
            your mood.
          </p>

          <GenreList />
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default GenresPage;
