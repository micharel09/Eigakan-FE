import React, { useEffect, useState, useRef } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import MovieCard from "./MovieCard";
import movieService from "../../apis/Movie/movie";

function MovieList({ genre }) {
  const [movieList, setMovieList] = useState([]);
  const elementRef = useRef(null);

  useEffect(() => {
    getMovies();
  }, []);

  const getMovies = async () => {
    try {
      const response = await movieService.getMovies();
      if (response.success) {
        setMovieList(response.data);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const slideRight = (element) => {
    const firstItem = element.children[0];
    const itemWidth = firstItem?.offsetWidth || 0;
    const scrollAmount = itemWidth * 3;

    element.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const slideLeft = (element) => {
    const firstItem = element.children[0];
    const itemWidth = firstItem?.offsetWidth || 0;
    const scrollAmount = itemWidth * 3;

    element.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative px-4">
      {/* Movies Container */}
      <div className="relative group">
        {/* Left Navigation Button */}
        <button
          onClick={() => slideLeft(elementRef.current)}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-40
                   opacity-0 group-hover:opacity-100 transition-opacity
                   bg-black/80 hover:bg-black p-2 rounded-r-lg"
        >
          <IoChevronBackOutline className="text-2xl text-white" />
        </button>

        {/* Movies Grid */}
        <div
          ref={elementRef}
          className="grid grid-flow-col auto-cols-max gap-6
                   overflow-x-auto scrollbar-hide scroll-smooth
                   snap-x snap-mandatory py-4"
        >
          {movieList.map((item) => (
            <div key={item.id} className="snap-start">
              <MovieCard movie={item} />
            </div>
          ))}
        </div>

        {/* Right Navigation Button */}
        <button
          onClick={() => slideRight(elementRef.current)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-40
                   opacity-0 group-hover:opacity-100 transition-opacity
                   bg-black/80 hover:bg-black p-2 rounded-l-lg"
        >
          <IoChevronForwardOutline className="text-2xl text-white" />
        </button>
      </div>
    </div>
  );
}

export default MovieList;
