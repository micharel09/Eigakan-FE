import { LogOut, Search } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import { debounce } from "lodash";
import GlobalApi from "../../components/Homepage/GlobalApi";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const Navbar = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateUser = () => {
      setUser(authService.getCurrentUser());
    };

    authService.addListener(updateUser);

    return () => {
      authService.removeListener(updateUser);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query) {
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
    }, 500),
    []
  );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${
        isScrolled ? "bg-black/80 backdrop-blur-sm shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between p-4 h-20 text-white">
        <div className="flex items-center gap-10">
          <Link to={"/homepage"}>
            <img src="/Eigakan-logo.png" alt="logo" className="w-32 sm:w-40" />
          </Link>

          <div className="flex gap-6 items-center">
            <Link
              to={"/homescreen"}
              className="hover:text-red-500 transition-colors"
            >
              Movies
            </Link>
            <Link to={"/"} className="hover:text-red-500 transition-colors">
              TV Shows
            </Link>
            <Link
              to={"/favorites"}
              className="hover:text-red-500 transition-colors"
            >
              Favorite
            </Link>
            <Link
              to={"/people"}
              className="hover:text-red-500 transition-colors"
            >
              Popular People
            </Link>
            <Link
              to={"/history"}
              className="hover:text-red-500 transition-colors"
            >
              Search History
            </Link>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <SearchBar
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            searchTerm={searchTerm}
            handleSearch={handleSearch}
            searchResults={searchResults}
            isLoading={isLoading}
            navigate={navigate}
          />

          {user ? (
            <div className="flex items-center gap-2">
              <img
                src={user.picture || "/avatar2.jpg"}
                alt="Avatar"
                className="h-8 w-8 rounded-full cursor-pointer"
              />
              <span className="text-sm font-medium">{user.fullName}</span>
              <LogOut
                className="size-6 cursor-pointer"
                onClick={handleLogout}
              />
            </div>
          ) : (
            <Link to="/login" className="hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const SearchBar = ({
  showSearch,
  setShowSearch,
  searchTerm,
  handleSearch,
  searchResults,
  isLoading,
  navigate,
}) => {
  return (
    <div className="relative search-container">
      <div className="flex items-center">
        <div
          className={`relative flex items-center bg-[rgba(0,0,0,0.75)] rounded-full 
            border border-[rgba(255,255,255,0.15)] overflow-hidden
            transition-all duration-300 ease-out
            ${showSearch ? "w-64" : "w-10"}`}
        >
          <div
            className={`flex items-center w-full transition-all duration-300 ease-out
            ${showSearch ? "pl-4 pr-12" : "px-2"}`}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Movies..."
              className={`w-full bg-transparent outline-none text-white placeholder-gray-400 text-sm
                transition-all duration-300 ease-out
                ${
                  showSearch
                    ? "opacity-100 max-w-full"
                    : "opacity-0 max-w-0 p-0"
                }`}
              autoFocus={showSearch}
            />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`absolute right-2 p-1 hover:bg-[rgba(255,255,255,0.1)] rounded-full
                transition-all duration-300 ease-out`}
            >
              <Search className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {searchTerm && showSearch && (
        <div
          className="absolute mt-2 w-full bg-[rgba(0,0,0,0.95)] rounded-lg border border-[rgba(255,255,255,0.1)]
          backdrop-blur-md shadow-xl animate-fadeIn"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No results found
            </div>
          ) : (
            <div>
              {searchResults.slice(0, 5).map((movie) => (
                <div
                  key={movie.id}
                  className="p-3 hover:bg-[rgba(255,255,255,0.1)] cursor-pointer
                    transition-colors duration-200 flex items-center gap-3"
                  onClick={() => {
                    navigate(`/movie/${movie.id}`);
                    setShowSearch(false);
                  }}
                >
                  <img
                    src={
                      movie.poster_path
                        ? `${IMAGE_BASE_URL}${movie.poster_path}`
                        : "/placeholder.svg"
                    }
                    alt={movie.title}
                    className="w-12 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {movie.title}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {movie.release_date?.split("-")[0] || "N/A"}
                    </p>
                  </div>
                </div>
              ))}
              {searchResults.length > 5 && (
                <div
                  className="sticky bottom-0 p-3 text-center text-sm bg-[rgba(0,0,0,0.95)] 
                    text-red-500 hover:text-red-400 cursor-pointer border-t 
                    border-[rgba(255,255,255,0.1)] transition-colors duration-200"
                  onClick={() => {
                    navigate(`/search?q=${searchTerm}`);
                    setShowSearch(false);
                  }}
                >
                  See all {searchResults.length} results
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
