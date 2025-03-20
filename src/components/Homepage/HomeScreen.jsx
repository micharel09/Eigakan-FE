import React from "react";
import { Helmet } from "react-helmet";
import MovieList from "../../components/Homepage/MovieList";
import Slider from "../Homepage/Slider";

const HomeScreen = () => {
  const movieCategories = [
    { title: "All Movies", genre: "", showAll: true },
    { title: "New Movies", genre: "" },
    { title: "Action Movies", genre: "Action" },
    { title: "Horror Movies", genre: "Horror" },
    { title: "Romance Movies", genre: "Romance" },
    { title: "Animation Movies", genre: "Animation" },
  ];

  return (
    <div className="min-h-screen bg-[#181818]">
      <Helmet>
        <title>Eigakan - Watch HD Movies Online</title>
        <meta
          name="description"
          content="Watch the latest movies and TV shows in HD quality on Eigakan"
        />
      </Helmet>

      {/* Hero Section */}
      <div className="relative">
        <Slider />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#181818] to-transparent z-10"
        />
      </div>

      {/* Content Section */}
      <div className="relative z-20 py-8 px-2 -mt-16">
        <div className="container mx-auto">
          {movieCategories.map(({ title, genre, showAll }) => (
            <MovieList
              key={`${title}-${genre}`}
              title={title}
              genreName={genre}
              showAll={showAll}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
