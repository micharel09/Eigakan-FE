import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import actorService from "../../apis/Actor/actor";
import Loading from "../../components/Loading/Loading";

const PopularPeople = () => {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  const [allActors, setAllActors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredActors, setFilteredActors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all actors once to determine total count
  useEffect(() => {
    const fetchTotalActors = async () => {
      try {
        const response = await actorService.getActors(1, 1000);
        if (response.success) {
          setAllActors(response.data);
          setFilteredActors(response.data);
          setTotalPages(Math.ceil(response.data.length / pageSize));
        }
      } catch (error) {
        console.error("Error fetching total actors count:", error);
      }
    };

    fetchTotalActors();
  }, [pageSize]);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredActors(allActors);
      setIsSearching(false);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const results = allActors.filter(
        (actor) =>
          actor.name.toLowerCase().includes(lowercasedSearch) ||
          (actor.job && actor.job.toLowerCase().includes(lowercasedSearch))
      );
      setFilteredActors(results);
      setIsSearching(true);
    }
    setCurrentPage(1);
    setTotalPages(Math.ceil(filteredActors.length / pageSize));
  }, [searchTerm, allActors]);

  // Update total pages when filtered actors change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredActors.length / pageSize));
  }, [filteredActors, pageSize]);

  // Fetch actors for the current page
  useEffect(() => {
    if (allActors.length === 0) return;

    setLoading(true);

    // Get the current page slice from filtered actors
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const currentPageActors = filteredActors.slice(startIdx, endIdx);

    setActors(currentPageActors);
    setLoading(false);
  }, [currentPage, pageSize, filteredActors, allActors]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKeyDown = (event, page) => {
    if (event.key === "Enter" || event.key === " ") {
      handlePageChange(page);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      setSearchTerm("");
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  if (loading && allActors.length === 0) return <Loading />;

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Popular People - Eigakan</title>
      </Helmet>

      {/* Smaller gradient transition from navbar that won't interfere with movie pages */}
      <div className="w-full h-16 bg-gradient-to-b from-black via-black/90 to-black/70"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">
            Popular People
          </h1>

          {/* Search input */}
          <div className="relative w-full md:w-64 lg:w-80">
            <input
              type="text"
              placeholder="Search actors..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-gray-800 text-white rounded-lg py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-[#FF009F] focus:border-transparent"
              aria-label="Search actors"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : (
          <>
            {filteredActors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white text-xl">
                  No actors found matching "{searchTerm}"
                </p>
                <button
                  onClick={handleClearSearch}
                  className="mt-4 px-4 py-2 bg-[#FF009F] text-white rounded-md hover:bg-[#FF009F]/80 transition-colors"
                  tabIndex={0}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <>
                {isSearching && (
                  <p className="text-gray-400 mb-4">
                    Found {filteredActors.length}{" "}
                    {filteredActors.length === 1 ? "actor" : "actors"} matching
                    "{searchTerm}"
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {actors.map((actor) => (
                    <Link
                      key={actor.id}
                      to={`/person/${actor.id}`}
                      className="group"
                    >
                      <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2">
                        <img
                          src={actor.picture}
                          alt={actor.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            e.target.src = "/placeholder-actor.jpg";
                          }}
                        />
                      </div>
                      <h2 className="text-white font-medium group-hover:text-[#FF009F] transition-colors">
                        {actor.name}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {actor.job || "Diễn viên"}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <nav
                      className="flex items-center space-x-2"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        onKeyDown={(e) => handleKeyDown(e, currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-md px-3 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                        tabIndex={0}
                      >
                        Previous
                      </button>

                      <div className="flex space-x-1 items-center">
                        {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = idx + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = idx + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + idx;
                          } else {
                            pageNumber = currentPage - 2 + idx;
                          }

                          return (
                            <button
                              key={pageNumber}
                              onClick={() => handlePageChange(pageNumber)}
                              onKeyDown={(e) => handleKeyDown(e, pageNumber)}
                              className={`rounded-md px-4 py-2 text-sm font-medium ${
                                currentPage === pageNumber
                                  ? "bg-[#FF009F] text-white"
                                  : "text-white hover:bg-gray-700 bg-gray-800"
                              }`}
                              aria-label={`Page ${pageNumber}`}
                              aria-current={
                                currentPage === pageNumber ? "page" : undefined
                              }
                              tabIndex={0}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}

                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && (
                              <span className="text-white px-1">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(totalPages)}
                              onKeyDown={(e) => handleKeyDown(e, totalPages)}
                              className="rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 bg-gray-800"
                              aria-label={`Page ${totalPages}`}
                              tabIndex={0}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        onKeyDown={(e) => handleKeyDown(e, currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="rounded-md px-3 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                        tabIndex={0}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PopularPeople;
