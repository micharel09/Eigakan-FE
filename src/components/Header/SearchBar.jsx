import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, Film, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import movieService from "../../apis/Movie/movie.js";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const SearchBar = ({ navigate }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using page 0 with page size 100 to get all possible results
      const response = await movieService.getMovies(0, 100, '', query, '');
      console.log("Search response:", response); // Debug log
      
      if (response.success && response.movies) {
        setSearchResults(response.movies);
      } else {
        console.error("No movies found in search response:", response);
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
      const poster = movie.medias.find(media => media.type === "POSTER");
      if (poster) return poster.url;
    }
    return 'https://via.placeholder.com/150x225?text=No+Image';
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
    <div className="relative" ref={searchRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowSearch(!showSearch);
        }}
        className="p-2.5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
        aria-label="Search"
      >
        <Search className="w-5 h-5 text-white" />
      </button>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+1rem)] w-[400px] bg-black/40 backdrop-blur-xl 
                     rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50"
          >
            <div
              className="absolute -top-2 right-4 w-4 h-4 bg-black/40 backdrop-blur-xl border-t border-l border-white/20 
                         transform rotate-45"
            />

            <div className="flex items-center p-3 border-b border-white/10">
              <Search className="w-5 h-5 text-[#FF009F] mr-2" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Tìm kiếm phim..."
                className="flex-1 bg-transparent outline-none text-white 
                         placeholder-gray-400 text-sm py-1.5"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {searchTerm && (
              <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#FF009F]/20 scrollbar-track-transparent">
                {isLoading ? (
                  <div className="p-6 text-center text-gray-400">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-2 border-[#FF009F]/30 border-t-[#FF009F] rounded-full animate-spin" />
                    </div>
                    <p className="mt-2 text-sm">Đang tìm kiếm...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
                      <Search className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400">Không tìm thấy kết quả</p>
                  </div>
                ) : (
                  <div>
                    <div className="p-2 text-xs text-gray-500 uppercase tracking-wider font-medium">
                      Kết quả tìm kiếm
                    </div>

                    {displayResults.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => {
                          navigate(`/movie/${movie.id}`);
                          setShowSearch(false);
                          setSearchTerm("");
                        }}
                        className="flex gap-3 p-3 hover:bg-white/5 
                                 cursor-pointer transition-colors"
                      >
                        <div className="w-20 h-28 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                          <img
                            src={getPosterUrl(movie) || `${IMAGE_BASE_URL}${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/150x225?text=No+Image';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {movie.title}
                            {movie.originName && movie.originName !== movie.title && (
                              <span className="text-gray-400 text-xs ml-1">
                                ({movie.originName})
                              </span>
                            )}
                          </h4>
                          
                          <div className="flex items-center mt-1 text-xs text-gray-400">
                            <span className="mr-2">{movie.releaseYear || "N/A"}</span>
                            {movie.nation && <span className="mr-2">{movie.nation}</span>}
                            {movie.duration && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(movie.duration)}
                              </span>
                            )}
                          </div>
                          
                          {movie.genreNames && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {movie.genreNames.split(", ").map((genre, index) => (
                                <span 
                                  key={index} 
                                  className="px-1.5 py-0.5 bg-white/10 rounded-sm text-[10px] text-gray-300"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {movie.director && (
                            <div className="mt-1.5 flex items-center text-xs text-gray-400">
                              <User className="w-3 h-3 mr-1" />
                              <span>Đạo diễn: {movie.director}</span>
                            </div>
                          )}
                          
                          {movie.rating > 0 && (
                            <div className="mt-1.5">
                              <span className="text-xs bg-[#FF009F]/20 text-[#FF009F] px-1.5 py-0.5 rounded-sm">
                                {movie.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          
                          {movie.description && (
                            <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
                              {movie.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {searchResults.length > 5 && (
                      <div className="p-3 border-t border-white/10">
                        <button
                          onClick={() => {
                            navigate(`/search?q=${searchTerm}`);
                            setShowSearch(false);
                            setSearchTerm("");
                          }}
                          className="w-full py-2.5 text-center text-sm bg-gradient-to-r from-[#FF009F]/80 to-[#FF009F]/60
                                   text-white rounded-lg hover:from-[#FF009F] hover:to-[#FF009F]/80 transition-all
                                   font-medium backdrop-blur-sm"
                        >
                          Xem tất cả {searchResults.length} kết quả
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
