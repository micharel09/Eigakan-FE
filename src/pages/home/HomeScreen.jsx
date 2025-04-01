import React, { Suspense } from "react";
import { Helmet } from "react-helmet";
import Slider from "../../components/Homepage/Slider";
import MovieList from "../../components/Homepage/MovieList";
import RecommendedMovies from "../../components/Homepage/RecommendedMovies";

/**
 * Các component hỗ trợ (UI Utilities)
 * ---------------------------------------
 */

// Component tạo đường phân cách gradient giữa các section
const GradientDivider = ({ position = "bottom", className = "" }) => {
  const isTop = position === "top";
  const baseClasses = `absolute ${
    isTop ? "top-0" : "bottom-0"
  } left-[5%] right-[5%] h-[1px] bg-gradient-to-r from-transparent via-[#FF009F]/30 to-transparent`;
  const shadowClasses = isTop
    ? "shadow-[0_-1px_5px_rgba(255,0,159,0.2)]"
    : "shadow-[0_2px_5px_rgba(255,0,159,0.2)]";

  return (
    <div
      className={`${baseClasses} ${shadowClasses} ${className}`}
      aria-hidden="true"
    />
  );
};

// Component tạo hiệu ứng mờ dần từ slider xuống nội dung chính
const GradientOverlay = ({ className = "" }) => {
  return (
    <div
      className={`absolute bottom-0 left-0 right-0 h-16 sm:h-24 md:h-32 bg-gradient-to-t from-[#181818] to-transparent z-10 ${className}`}
      aria-hidden="true"
    />
  );
};

// Component hiển thị loading spinner
const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-[6px]",
  };

  return (
    <div className={`flex justify-center items-center py-10 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

// Component bọc các movie section để đảm bảo tính nhất quán
const MovieSection = ({ section, children }) => {
  return (
    <div
      className={`mb-6 sm:mb-8 py-2 sm:py-3 relative ${
        !section.isFirst ? "pt-4 sm:pt-6 before:content-['']" : ""
      }`}
    >
      {!section.isFirst && (
        <GradientDivider position="top" className="before:absolute" />
      )}
      {children}
    </div>
  );
};

/**
 * Component chính HomeScreen
 * ---------------------------------------
 */
const HomeScreen = () => {
  // Dữ liệu cho các movie section
  const movieSections = [
    { title: "New Movies", genreName: "", showAll: false, isFirst: true },
    { title: "Action Movies", genreName: "Action", showAll: false },
    { title: "Horror Movies", genreName: "Horror", showAll: false },
    { title: "Romance Movies", genreName: "Romance", showAll: false },
    { title: "Animation Movies", genreName: "Animation", showAll: false },
    { title: "All Movies", genreName: "", showAll: true },
  ];

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
        <GradientOverlay />
      </div>

      {/* Content section với hiệu ứng padding-top âm để tạo overlap */}
      <div className="relative z-20 py-4 sm:py-6 md:py-8 -mt-8 sm:-mt-12 md:-mt-16">
        <div className="container mx-auto px-2 sm:px-4">
          {/* Recommendations section */}
          <div className="mb-6 sm:mb-8 py-2 sm:py-4 border-b border-[#FF009F]/10 relative">
            <RecommendedMovies isModal={false} />
            <GradientDivider position="bottom" />
          </div>

          {/* Movie list sections */}
          {movieSections.map((section) => (
            <MovieSection key={section.title} section={section}>
              <MovieList
                title={section.title}
                genreName={section.genreName}
                showAll={section.showAll}
              />
            </MovieSection>
          ))}
        </div>
      </div>

      {/* Suspense fallback */}
      <Suspense fallback={<LoadingSpinner />}>
        {/* Navbar is already included in the PersistentLayout */}
      </Suspense>
    </div>
  );
};

export default HomeScreen;
