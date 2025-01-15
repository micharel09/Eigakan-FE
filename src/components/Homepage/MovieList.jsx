import React, { useEffect, useRef, useState } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import HrMovieCard from "./HrMovieCard";
import MovieCard from "./MovieCard";
import GlobalApi from "./GlobalApi";

function MovieList({ genreId, index_ }) {
  const [movieList, setMovieList] = useState([]);
  const elementRef = useRef(null);

  useEffect(() => {
    getMovieByGenreId();
  }, []);

  const getMovieByGenreId = () => {
    GlobalApi.getMovieByGenreId(genreId).then((resp) => {
      setMovieList(resp.data.results);
    });
  };

  const slideRight = (element) => {
    element.scrollLeft += 500;
  };

  const slideLeft = (element) => {
    element.scrollLeft -= 500;
  };

  return (
    <div className="relative">
      <IoChevronBackOutline
        onClick={() => slideLeft(elementRef.current)}
        className={`text-[50px] text-white
           p-2 z-10 cursor-pointer 
           hidden md:block absolute
           ${index_ % 3 === 0 ? "mt-[80px]" : "mt-[150px]"}
           hover:bg-gray-700/80 rounded-xl`}
      />

      <div
        ref={elementRef}
        className="flex overflow-x-auto gap-2 md:gap-4 lg:gap-8
                  scrollbar-hide scroll-smooth pt-4 px-3 pb-4
                  snap-x snap-mandatory"
      >
        {movieList.map((item, index) => (
          <div key={index} className="snap-start">
            {index_ % 3 === 0 ? (
              <HrMovieCard movie={item} />
            ) : (
              <MovieCard movie={item} />
            )}
          </div>
        ))}
      </div>

      <IoChevronForwardOutline
        onClick={() => slideRight(elementRef.current)}
        className={`text-[50px] text-white hidden md:block
           p-2 cursor-pointer z-10 top-0
           absolute right-0 
           ${index_ % 3 === 0 ? "mt-[80px]" : "mt-[150px]"}
           hover:bg-gray-700/80 rounded-xl`}
      />
    </div>
  );
}

export default MovieList;
