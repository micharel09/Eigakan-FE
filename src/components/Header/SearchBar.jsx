import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, Film, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import movieService from "../../apis/Movie/movie.js";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const SearchBar = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using page 1 with page size 100 to get all possible results
      const response = await movieService.getMovies(1, 100, "", query, "");

      if (response.success && response.movies) {
        setSearchResults(response.movies);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get poster URL from movie media
  const getPosterUrl = (movie) => {
    if (movie.medias && movie.medias.length > 0) {
      const poster = movie.medias.find((media) => media.type === "POSTER");
      if (poster) return poster.url;
      return movie.medias[0].url;
    }
    return "/placeholder.svg";
  };

  // Format duration from minutes to hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get the first 5 results to display in dropdown
  const displayResults = searchResults.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={searchRef}
        className="w-full max-w-3xl bg-gray-900/90 rounded-xl border border-gray-700 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center p-4 border-b border-gray-700">
          <Search className="w-5 h-5 text-[#FF009F] mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Tìm kiếm phim..."
            className="flex-1 bg-transparent outline-none text-white 
                     placeholder-gray-400 text-base py-2"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors mr-2"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="flex justify-center">
                <div className="w-10 h-10 border-2 border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin" />
              </div>
              <p className="mt-3 text-sm">Đang tìm kiếm...</p>
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800/50 mb-4">
                <Search className="w-10 h-10 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg">Không tìm thấy kết quả</p>
              <p className="text-gray-500 mt-2">
                Thử tìm kiếm với từ khóa khác
              </p>
            </div>
          ) : searchTerm ? (
            <div>
              <div className="p-3 text-xs text-gray-400 uppercase tracking-wider font-medium bg-gray-800/50">
                Kết quả tìm kiếm
              </div>

              {displayResults.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => {
                    navigate(`/movie/${movie.id}`);
                    onClose();
                  }}
                  className="flex gap-4 p-4 hover:bg-gray-800/50 
                           cursor-pointer transition-colors border-b border-gray-800/80"
                >
                  <div className="w-24 h-36 rounded-md overflow-hidden bg-gray-800 flex-shrink-0 shadow-lg">
                    <img
                      src={getPosterUrl(movie)}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-white">
                      {movie.title}
                      {movie.originName && movie.originName !== movie.title && (
                        <span className="text-gray-400 text-sm ml-2">
                          ({movie.originName})
                        </span>
                      )}
                    </h4>

                    <div className="flex items-center mt-2 text-sm text-gray-400">
                      <span className="mr-3">{movie.releaseYear || "N/A"}</span>
                      {movie.nation && (
                        <span className="mr-3">{movie.nation}</span>
                      )}
                      {movie.duration && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(movie.duration)}
                        </span>
                      )}
                    </div>

                    {movie.genreNames && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {movie.genreNames.split(", ").map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-[#FF009F]/10 rounded-md text-xs text-[#FF009F]"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    {movie.director && (
                      <div className="mt-2 flex items-center text-sm text-gray-400">
                        <User className="w-4 h-4 mr-1" />
                        <span>Đạo diễn: {movie.director}</span>
                      </div>
                    )}

                    {movie.rating > 0 && (
                      <div className="mt-2">
                        <span className="text-sm bg-[#FF009F]/20 text-[#FF009F] px-2 py-0.5 rounded-md">
                          {movie.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {movie.description && (
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                        {movie.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {searchResults.length > 5 && (
                <div className="p-4 bg-gray-800/30">
                  <button
                    onClick={() => {
                      navigate(`/search?q=${searchTerm}`);
                      onClose();
                    }}
                    className="w-full py-3 text-center text-sm bg-gradient-to-r from-[#FF009F] to-[#FF6B9F]
                             text-white rounded-lg hover:from-[#FF009F]/90 hover:to-[#FF6B9F]/90 transition-all
                             font-medium shadow-lg hover:shadow-[#FF009F]/20 hover:shadow-xl"
                  >
                    Xem tất cả {searchResults.length} kết quả
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
