import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Spin } from "antd";
import movieService from "../../apis/Movie/movie";
import genreService from "../../apis/Genre/genre";
import Navbar from "../../components/Header/Navbar";

const GenrePage = () => {
  const { genreName } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState(null);
  const [allGenres, setAllGenres] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await genreService.getGenres();
        if (response.data) {
          setAllGenres(response.data);

          // Tìm thông tin chi tiết về thể loại hiện tại
          const currentGenre = response.data.find(
            (g) => g.name.toLowerCase() === genreName.toLowerCase()
          );
          setGenre(currentGenre);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };

    fetchGenres();
  }, [genreName]);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const response = await movieService.getMovies(1, 24, genreName);
        if (response.success && response.movies) {
          setMovies(response.movies);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    if (genreName) {
      fetchMovies();
    }
  }, [genreName]);

  return (
    <div className="min-h-screen bg-[#181818]">
      <Helmet>
        <title>{genreName ? `${genreName} Movies` : "Genre"} - Eigakan</title>
      </Helmet>

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {genreName} <span className="text-[#FF009F]">Movies</span>
          </h1>
          <p className="text-gray-400 max-w-3xl">
            {genre?.description ||
              `Explore our collection of ${genreName} movies. Find the best ${genreName} films to watch online in HD quality.`}
          </p>
        </div>
      </div>

      {/* Genres Navigation */}
      <div className="px-4 md:px-8 mb-8">
        <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex space-x-2 pb-2">
            {allGenres.map((g) => (
              <Link
                key={g.id}
                to={`/genre/${g.name}`}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  g.name === genreName
                    ? "bg-[#FF009F] text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {g.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <>
              {movies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {movies.map((movie) => (
                    <Link
                      key={movie.id}
                      to={`/movie/${movie.id}`}
                      className="group relative"
                    >
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
                        <img
                          src={movie.medias?.[0]?.url || "/placeholder.svg"}
                          alt={movie.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute inset-0 flex flex-col justify-between p-3">
                            <div className="flex justify-between items-start">
                              <span className="bg-[#FF009F] text-white text-xs px-2 py-1 rounded">
                                {movie.quality || "HD"}
                              </span>
                              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {movie.duration} min
                              </span>
                            </div>
                            <div>
                              <h3 className="text-white text-sm font-medium line-clamp-2 mb-1">
                                {movie.title}
                              </h3>
                              <div className="space-y-1 text-xs text-gray-300">
                                <div className="flex items-center gap-2">
                                  <span>{movie.releaseYear}</span>
                                  {movie.imdbScore && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <svg
                                          className="w-3 h-3 text-[#FF009F]"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        {movie.imdbScore}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="line-clamp-1">
                                  {movie.genreNames}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-white text-sm font-medium mt-2 line-clamp-2 group-hover:text-[#FF009F] transition-colors duration-300">
                        {movie.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-xl text-gray-400">
                    No movies found for this genre
                  </h3>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default GenrePage;
