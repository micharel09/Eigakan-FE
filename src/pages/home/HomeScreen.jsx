import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
import {
  SliderSkeleton,
  MovieListSkeleton,
} from "../../components/Homepage/SkeletonUI";
import FadeInSection from "../../components/Homepage/FadeInSection";
import Navbar from "../../components/Header/Navbar";
import Slider from "../../components/Homepage/Slider";

// Lazy load components
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
    <div className="relative bg-gray-900">
      <Helmet>
        <title>Home</title>
      </Helmet>

      <div className="w-full">
        <div className="space-y-12 pb-12">
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
  );
};

export default HomeScreen;
