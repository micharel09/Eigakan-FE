import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import GlobalApi from "../Homepage/GlobalApi";

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
      const response = await GlobalApi.searchMovies(query);
      const filteredResults = response.data.results.filter(
        (movie) => movie.title && (movie.poster_path || movie.backdrop_path)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

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
            className="absolute right-0 top-[calc(100%+1rem)] w-[350px] bg-black/40 backdrop-blur-xl 
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
              <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#FF009F]/20 scrollbar-track-transparent">
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

                    {searchResults.slice(0, 5).map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => {
                          navigate(`/movie/${movie.id}`);
                          setShowSearch(false);
                          setSearchTerm("");
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 
                                 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-16 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                          <img
                            src={`${IMAGE_BASE_URL}${
                              movie.poster_path || movie.backdrop_path
                            }`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {movie.title}
                          </h4>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400">
                              {movie.release_date?.split("-")[0] || "N/A"}
                            </span>
                            {movie.vote_average > 0 && (
                              <div className="flex items-center ml-2">
                                <span className="text-xs bg-[#FF009F]/20 text-[#FF009F] px-1.5 py-0.5 rounded-sm">
                                  {movie.vote_average.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
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
