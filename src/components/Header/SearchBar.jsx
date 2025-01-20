import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import GlobalApi from "../Homepage/GlobalApi";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const SearchBar = ({ navigate }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      <motion.div
        initial={false}
        animate={{ width: showSearch ? 256 : 40 }}
        className="flex items-center justify-end bg-white/10 rounded-full overflow-hidden hover:bg-white/15 focus-within:bg-white/15"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch(true);
          }}
          placeholder="Search movies..."
          className={`flex-1 bg-transparent outline-none text-white placeholder-gray-400 text-sm px-4 py-2 transition-all duration-300
            ${showSearch ? "w-full opacity-100" : "w-0 opacity-0 p-0"}`}
          autoFocus={showSearch}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch(!showSearch);
          }}
          className="flex-shrink-0 p-2.5 hover:bg-white/10 rounded-full transition-colors"
        >
          <Search className="w-4 h-4 text-gray-400" />
        </button>
      </motion.div>

      <AnimatePresence>
        {searchTerm && showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute mt-2 w-full bg-black/40 backdrop-blur-md rounded-lg border border-white/10 shadow-xl overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No results found
              </div>
            ) : (
              <div>
                {searchResults.slice(0, 5).map((movie) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      navigate(`/movie/${movie.id}`);
                      setShowSearch(false);
                      setSearchTerm("");
                    }}
                    className="group p-3 hover:bg-white/10 cursor-pointer transition-all duration-200 flex items-center gap-3"
                  >
                    <img
                      src={
                        movie.poster_path
                          ? `${IMAGE_BASE_URL}${movie.poster_path}`
                          : "/placeholder.svg"
                      }
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded-md group-hover:ring-2 ring-red-500 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-red-400 transition-colors">
                        {movie.title}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {movie.release_date?.split("-")[0] || "N/A"}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {searchResults.length > 5 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => {
                      navigate(`/search?q=${searchTerm}`);
                      setShowSearch(false);
                      setSearchTerm("");
                    }}
                    className="w-full p-3 text-center text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    See all {searchResults.length} results
                  </motion.button>
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
