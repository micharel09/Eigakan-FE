import React, { Suspense, useState, useEffect } from "react";
import Navbar from "../../components/Header/Navbar";
import { Helmet } from "react-helmet";

// Lazy load các component với preload
const Slider = React.lazy(() => import("../../components/Homepage/Slider"));
const ProductionHouse = React.lazy(() =>
  import("../../components/Homepage/ProductionHouse")
);
const HrMovieCard = React.lazy(() =>
  import("../../components/Homepage/HrMovieCard")
);
const GenreMovieList = React.lazy(() =>
  import("../../components/Homepage/GenresMovieList")
);

// Component Loading Spinner với animation
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-40 bg-[#1A1C29] bg-opacity-80">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-500"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      </div>
    </div>
  </div>
);

const HomeScreen = () => {
  const [components, setComponents] = useState({
    slider: false,
    production: false,
    movieCard: false,
    genreList: false,
  });

  // Preload các component
  useEffect(() => {
    const preloadComponents = () => {
      const importPromises = [
        import("../../components/Homepage/Slider"),
        import("../../components/Homepage/ProductionHouse"),
        import("../../components/Homepage/HrMovieCard"),
        import("../../components/Homepage/GenresMovieList"),
      ];

      Promise.all(importPromises);
    };

    preloadComponents();
  }, []);

  // Sequence loading
  useEffect(() => {
    const loadSequence = async () => {
      // Start với slider
      setComponents((prev) => ({ ...prev, slider: true }));

      // Production House sau 800ms
      await new Promise((resolve) => setTimeout(resolve, 400));
      setComponents((prev) => ({ ...prev, production: true }));

      // Movie Card sau 600ms
      await new Promise((resolve) => setTimeout(resolve, 600));
      setComponents((prev) => ({ ...prev, movieCard: true }));

      // Genre List sau 400ms
      await new Promise((resolve) => setTimeout(resolve, 400));
      setComponents((prev) => ({ ...prev, genreList: true }));
    };

    loadSequence();
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1C29]">
      <Helmet>
        <title>Movies - Home</title>
      </Helmet>

      <div className="space-y-4">
        <div
          className={`transition-opacity duration-500 ${
            components.slider ? "opacity-100" : "opacity-0"
          }`}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <Slider />
          </Suspense>
        </div>

        <div
          className={`transition-opacity duration-500 ${
            components.production ? "opacity-100" : "opacity-0"
          }`}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <ProductionHouse />
          </Suspense>
        </div>

        <div
          className={`transition-opacity duration-500 ${
            components.movieCard ? "opacity-100" : "opacity-0"
          }`}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <HrMovieCard />
          </Suspense>
        </div>

        <div
          className={`transition-opacity duration-500 ${
            components.genreList ? "opacity-100" : "opacity-0"
          }`}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <GenreMovieList />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
