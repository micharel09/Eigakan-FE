import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
import Slider from "../../components/Homepage/Slider";
import MovieList from "../../components/Homepage/MovieList";
import Navbar from "../../components/Header/Navbar";

const HomeScreen = () => {
  return (
    <div className="min-h-screen bg-[#181818] relative">
      <Helmet>
        <title>Eigakan - Watch HD Movies Online</title>
      </Helmet>

      {/* Slider section */}
      <div className="relative">
        <Slider />

        {/* Gradient overlay để tạo hiệu ứng mờ dần từ slider xuống */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#181818] to-transparent z-10"></div>
      </div>

      {/* Content section với hiệu ứng padding-top âm để tạo overlap */}
      <div className="relative z-20 py-8 px-2 -mt-16">
        <div className="container mx-auto">
          <MovieList title="All Movies" genreName="" showAll={true} />
          <MovieList title="New Movies" genreName="" />
          <MovieList title="Action Movies" genreName="Action" />
          <MovieList title="Horror Movies" genreName="Horror" />
          <MovieList title="Romance Movies" genreName="Romance" />
          <MovieList title="Animation Movies" genreName="Animation" />
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default HomeScreen;
