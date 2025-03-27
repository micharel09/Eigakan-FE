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
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
        <meta
          name="description"
          content="Watch HD movies online on Eigakan, your ultimate streaming platform"
        />
      </Helmet>

      {/* Slider section */}
      <div className="relative">
        <Slider />

        {/* Gradient overlay để tạo hiệu ứng mờ dần từ slider xuống */}
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 md:h-32 bg-gradient-to-t from-[#181818] to-transparent z-10"></div>
      </div>

      {/* Content section với hiệu ứng padding-top âm để tạo overlap */}
      <div className="relative z-20 py-4 sm:py-6 md:py-8 -mt-8 sm:-mt-12 md:-mt-16">
        <div className="container mx-auto px-2 sm:px-4">
          {/* AI Recommendations được hiển thị thông qua nút trong Navbar */}
          <MovieList title="All Movies" genreName="" showAll={true} />
          <MovieList title="New Movies" genreName="" />
          <MovieList title="Action Movies" genreName="Action" />
          <MovieList title="Horror Movies" genreName="Horror" />
          <MovieList title="Romance Movies" genreName="Romance" />
          <MovieList title="Animation Movies" genreName="Animation" />
        </div>
      </div>

      {/* Add a loading fallback for Suspense */}
      <Suspense
        fallback={
          <div className="flex justify-center items-center py-10">
            <div className="w-10 h-10 border-4 border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin"></div>
          </div>
        }
      >
        <Navbar />
      </Suspense>
    </div>
  );
};

export default HomeScreen;
