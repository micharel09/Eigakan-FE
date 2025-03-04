import React, { useEffect, useState, useRef } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import MovieCard from "./MovieCard";
import movieService from "../../apis/Movie/movie";
import { Pagination } from "antd";
import { Spin } from "antd";

function MovieList({ genreName }) {
  const [movieList, setMovieList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const elementRef = useRef(null);

  useEffect(() => {
    getMovies();
  }, [currentPage, genreName]);

  const getMovies = async () => {
    setLoading(true);
    try {
      const response = await movieService.getMovies(
        currentPage,
        pageSize,
        genreName // Dùng genreName làm genreFilter
      );
      console.log("API response:", response); // Debug log
      
      if (response.success && response.movies) {
        setMovieList(response.movies);
        setTotal(response.total || 0);
      } else {
        console.error("No movies found in response:", response);
        setMovieList([]);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setMovieList([]);
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm xử lý khi chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
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
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : movieList && movieList.length > 0 ? (
        <>
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

          {/* Thêm phần pagination */}
          {total > pageSize && (
            <div className="flex justify-center mt-4">
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                onChange={handlePageChange}
                className="text-white"
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-400">
          Không có phim nào trong thể loại này
        </div>
      )}
    </div>
  );
}

export default MovieList;
