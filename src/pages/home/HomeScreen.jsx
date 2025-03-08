import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
import Slider from "../../components/Homepage/Slider";
import MovieList from "../../components/Homepage/MovieList";
import Navbar from "../../components/Header/Navbar";

const HomeScreen = () => {
  return (
    <div className="min-h-screen bg-[#181818]">
      <Helmet>
        <title>Eigakan - Watch HD Movies Online</title>
      </Helmet>

      <Slider />

      <div className="py-8 px-2">
        <MovieList title="All Movies" genreName="" showAll={true} />
        <MovieList title="New Movies" genreName="" />
        <MovieList title="Action Movies" genreName="Action" />
        <MovieList title="Horror Movies" genreName="Horror" />
        <MovieList title="Romance Movies" genreName="Romance" />
        <MovieList title="Animation Movies" genreName="Animation" />
      </div>

      <Navbar />
    </div>
  );
};

export default HomeScreen;
