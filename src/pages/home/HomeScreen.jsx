import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
import {
  SliderSkeleton,
  MovieListSkeleton,
} from "../../components/Homepage/SkeletonUI";
import FadeInSection from "../../components/Homepage/FadeInSection";
import Navbar from "../../components/Header/Navbar";

// Lazy load components
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

const HomeScreen = () => {
  return (
    <div className="min-h-screen bg-[#161515]">
      <Helmet>
        <title>Home</title>
      </Helmet>

      <div className="relative">
        <div className="w-full h-screen">
          <div className="space-y-12">
            <Suspense fallback={<SliderSkeleton />}>
              <Slider />
            </Suspense>

            <FadeInSection>
              <Suspense fallback={<MovieListSkeleton />}>
                <ProductionHouse />
              </Suspense>
            </FadeInSection>

            <FadeInSection>
              <Suspense fallback={<MovieListSkeleton />}>
                <HrMovieCard />
              </Suspense>
            </FadeInSection>

            <FadeInSection>
              <Suspense
                fallback={
                  <div className="space-y-8">
                    {[1, 2, 3].map((i) => (
                      <MovieListSkeleton key={i} />
                    ))}
                  </div>
                }
              >
                <GenreMovieList />
              </Suspense>
            </FadeInSection>
          </div>
        </div>

        <Navbar />
      </div>
    </div>
  );
};

export default HomeScreen;
