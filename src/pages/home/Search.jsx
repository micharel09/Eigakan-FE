import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, SearchIcon } from "lucide-react";
import GlobalApi from "../../components/Homepage/GlobalApi";
import { debounce } from "lodash";
import { Helmet } from "react-helmet";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await GlobalApi.searchMovies(query);
        setSearchResults(response.data.results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchTerm(query);
      debouncedSearch(query);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setSearchParams(query ? { q: query } : {});
    debouncedSearch(query);
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Search Movies - Eigakan</title>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Input */}
        <div className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search for movies..."
            className="w-full pl-12 pr-4 py-3 bg-gray-900 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-red-500" />
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && searchResults.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {searchResults.map((movie) => (
              <div
                key={movie.id}
                className="cursor-pointer group"
                onClick={() => handleMovieClick(movie.id)}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                  <img
                    src={
                      movie.poster_path
                        ? `${IMAGE_BASE_URL}${movie.poster_path}`
                        : "/placeholder.svg"
                    }
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 p-4">
                      <h3 className="text-lg font-bold">{movie.title}</h3>
                      <p className="text-sm text-gray-300">
                        {new Date(movie.release_date).getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && searchTerm && searchResults.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">No movies found for "{searchTerm}"</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !searchTerm && (
          <div className="text-center py-20">
            <SearchIcon className="mx-auto h-12 w-12 text-gray-600 mb-4" />
            <p className="text-gray-400">Start typing to search for movies</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
