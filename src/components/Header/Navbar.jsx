import { LogOut, Menu, Search } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../apis/Auth/auth";
import { debounce } from "lodash";
import GlobalApi from "../../components/Homepage/GlobalApi";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const Navbar = () => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
        setSearchResults(response.data.results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    debouncedSearch(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm) {
      navigate(`/search?q=${searchTerm}`);
      setShowSearch(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearch && !event.target.closest(".search-container")) {
        setShowSearch(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch]);

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

          <div className="hidden sm:flex gap-6 items-center">
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
              to={"/history"}
              className="hover:text-red-500 transition-colors"
            >
              Search History
            </Link>
          </div>
        </div>

        <div className="flex gap-2 items-center z-50">
          <div className="relative search-container">
            {showSearch ? (
              <div className="absolute right-0 top-[-10px] w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  onKeyPress={handleKeyPress}
                  placeholder="Search movies..."
                  className="w-full pl-4 pr-10 py-2 bg-gray-900 rounded-lg text-white"
                  autoFocus
                />
                {searchTerm && (
                  <div className="absolute mt-2 w-full bg-gray-900 rounded-lg">
                    {isLoading ? (
                      <div className="p-4 text-center">Loading...</div>
                    ) : (
                      <>
                        {searchResults.slice(0, 5).map((movie) => (
                          <div
                            key={movie.id}
                            className="p-2 hover:bg-gray-800 cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              navigate(`/movie/${movie.id}`);
                              setShowSearch(false);
                              setSearchTerm("");
                            }}
                          >
                            <img
                              src={
                                movie.poster_path
                                  ? `${IMAGE_BASE_URL}${movie.poster_path}`
                                  : "/placeholder.svg"
                              }
                              alt={movie.title}
                              className="w-10 h-14 object-cover rounded"
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {movie.title}
                              </p>
                              <p className="text-xs text-gray-400">
                                {movie.release_date?.split("-")[0] || "N/A"}
                              </p>
                            </div>
                          </div>
                        ))}
                        {searchResults.length > 5 && (
                          <div
                            className="p-2 text-center text-sm text-red-500 hover:bg-gray-800 cursor-pointer border-t border-gray-700"
                            onClick={() => {
                              navigate(`/search?q=${searchTerm}`);
                              setShowSearch(false);
                            }}
                          >
                            See all {searchResults.length} results
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Search
                className="size-6 cursor-pointer"
                onClick={() => setShowSearch(true)}
              />
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <img
                src={user.picture || "/avatar2.jpg"}
                alt="Avatar"
                className="h-8 w-8 rounded-full cursor-pointer"
              />
              <span className="hidden sm:inline text-sm font-medium">
                {user.fullName}
              </span>
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

          <div className="sm:hidden">
            <Menu
              className="size-6 cursor-pointer"
              onClick={toggleMobileMenu}
            />
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
            <div className="bg-white w-64 h-full absolute right-0 p-4">
              <div className="flex flex-col gap-4">
                {user && (
                  <div className="flex items-center gap-2 mb-4">
                    <img
                      src={user.picture || "/avatar2.jpg"}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-sm font-medium">{user.fullName}</span>
                  </div>
                )}
                <Link
                  to={"/"}
                  className="hover:underline"
                  onClick={toggleMobileMenu}
                >
                  Movies
                </Link>
                <Link
                  to={"/"}
                  className="hover:underline"
                  onClick={toggleMobileMenu}
                >
                  TV Shows
                </Link>
                <Link
                  to={"/favorites"}
                  className="hover:underline"
                  onClick={toggleMobileMenu}
                >
                  Favorite
                </Link>
                <Link
                  to={"/history"}
                  className="hover:underline"
                  onClick={toggleMobileMenu}
                >
                  Search History
                </Link>
                {user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                    className="hover:underline"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="hover:underline"
                    onClick={toggleMobileMenu}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
