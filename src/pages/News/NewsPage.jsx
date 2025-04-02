import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SearchOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import NewsApi from "../../apis/News/news";
import UserApi from "../../apis/User/user";
import { notification } from "antd";

// Using Tailwind classes instead of CSS overrides
const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isMounted = useRef(false);
  const pageSize = 6;

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await NewsApi.getAllNews();

      if (response.success) {
        const activeNews = response.data.filter(
          (news) =>
            news.status === "1" ||
            news.status === 1 ||
            news.status?.toLowerCase() === "active"
        );

        // Fetch user details for each news item
        const newsWithUserDetails = await Promise.all(
          activeNews.map(async (newsItem) => {
            if (newsItem.userId) {
              try {
                const userResponse = await UserApi.getUserDetail(
                  newsItem.userId
                );

                // Check if user data is properly structured
                if (userResponse && userResponse.success && userResponse.data) {
                  const userData = userResponse.data;
                  return {
                    ...newsItem,
                    userAvatar: userData.picture || "/avatar.jpg",
                    userName: userData.fullName || "Anonymous",
                  };
                } else {
                  console.error(
                    `Invalid user data format for news ID ${newsItem.id}:`,
                    userResponse
                  );
                  return newsItem;
                }
              } catch (error) {
                console.error(
                  `Failed to fetch user data for news ID ${newsItem.id}:`,
                  error
                );
                return newsItem; // Return original news item if user fetch fails
              }
            }
            return newsItem;
          })
        );

        // Store all active news with user details
        setAllNews(newsWithUserDetails);

        // Apply filtering if there's a search query
        const newsToDisplay = searchQuery
          ? filterNewsBySearchQuery(newsWithUserDetails, searchQuery)
          : newsWithUserDetails;

        const startIndex = 0;
        const endIndex = page * pageSize;
        const paginatedNews = newsToDisplay.slice(startIndex, endIndex);

        setFilteredNews(newsToDisplay);
        setNews((prevNews) =>
          page === 1 ? paginatedNews : [...prevNews, ...paginatedNews]
        );

        setHasMore(endIndex < newsToDisplay.length);
      } else {
        throw new Error(response.message || "Failed to fetch news");
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch news",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter news by search query
  const filterNewsBySearchQuery = (newsItems, query) => {
    if (!query) return newsItems;

    const lowercaseQuery = query.toLowerCase();
    return newsItems.filter(
      (item) =>
        item.title?.toLowerCase().includes(lowercaseQuery) ||
        item.content?.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle pagination and search
  useEffect(() => {
    // Skip on initial render
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (searchQuery === "") {
      // When search is cleared, update pagination with all news
      if (allNews.length > 0) {
        const startIndex = 0;
        const endIndex = page * pageSize;
        const paginatedNews = allNews.slice(startIndex, endIndex);

        setFilteredNews(allNews);
        setNews(paginatedNews);
        setHasMore(endIndex < allNews.length);
      }
    } else if (page > 1) {
      // Only handle pagination for search results when page changes
      const startIndex = 0;
      const endIndex = page * pageSize;
      const paginatedNews = filteredNews.slice(startIndex, endIndex);
      setNews(paginatedNews);
      setHasMore(endIndex < filteredNews.length);
    }
  }, [page, searchQuery, allNews, pageSize]);

  const handleSearch = (e) => {
    e.preventDefault();

    // Reset to page 1 when searching
    setPage(1);

    if (allNews.length > 0) {
      // Filter the existing news
      const newsToDisplay = filterNewsBySearchQuery(allNews, searchQuery);

      // Update filtered news
      setFilteredNews(newsToDisplay);

      // Update displayed news with pagination
      const paginatedNews = newsToDisplay.slice(0, pageSize);
      setNews(paginatedNews);

      // Update hasMore based on filtered results
      setHasMore(pageSize < newsToDisplay.length);
    } else {
      // If we don't have news yet, just trigger a fetch
      fetchNews();
    }
  };

  return (
    <div className="bg-black ">
      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
      />
      {searchQuery && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400"
          >
            {filteredNews.length === 0 ? (
              <p>No results found for "{searchQuery}"</p>
            ) : (
              <p>
                Found {filteredNews.length} results for "{searchQuery}"
              </p>
            )}
          </motion.div>
        </div>
      )}
      <NewsGrid
        news={news}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={() => setPage((prev) => prev + 1)}
      />
    </div>
  );
};

const HeroSection = ({ searchQuery, setSearchQuery, onSearch }) => (
  <div className="relative px-4 overflow-hidden pt-1 pb-4 bg-black">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative max-w-7xl mx-auto text-center"
    >
      <h1
        className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent 
        bg-gradient-to-r from-[#FF009F] via-[#FF009F] to-[#FF009F]"
      >
        Eigakan News
      </h1>
      <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
        Stay updated with the latest news, reviews, and insights from the world
        of cinema
      </p>

      <form onSubmit={onSearch} className="max-w-2xl mx-auto relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search news..."
          className="w-full px-6 py-4 bg-gray-900/50 backdrop-blur-sm border border-gray-800 
            rounded-full text-gray-200 placeholder-gray-500 outline-none focus:border-[#FF009F]
            transition-all duration-300 shadow-lg"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3
            bg-[#FF009F] hover:bg-[#D1007F] text-white rounded-full 
            transition-all duration-300"
        >
          <SearchOutlined className="text-lg" />
        </motion.button>
      </form>
    </motion.div>
  </div>
);

const NewsGrid = ({ news, loading, hasMore, onLoadMore }) => (
  <div className="max-w-7xl mx-auto px-4 pb-20">
    {news.length === 0 && !loading ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="mb-6 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 mx-auto mb-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No Results Found</h3>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          We couldn't find any news matching your search. Try using different
          keywords or browsing all news.
        </p>
      </motion.div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {news.map((item, index) => (
            <NewsCard key={item.id} news={item} index={index} />
          ))}
        </AnimatePresence>
      </div>
    )}

    {news.length > 0 && hasMore && (
      <div className="flex justify-center mt-16">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLoadMore}
          disabled={loading}
          className="px-8 py-4 bg-[#FF009F] hover:bg-[#D1007F] text-white rounded-full
            transition-all duration-300 font-medium flex items-center gap-2 
            disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[#FF009F]/25"
        >
          {loading ? (
            <Spin size="small" />
          ) : (
            <>
              Load More
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
                animate={{ y: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </motion.svg>
            </>
          )}
        </motion.button>
      </div>
    )}
  </div>
);

const NewsCard = ({ news, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
  >
    <Link to={`/news/${news.id}`} className="block group">
      <div
        className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden 
        border border-gray-700/50 hover:border-[#FF009F]/50 transition-all duration-500
        hover:shadow-xl hover:shadow-[#FF009F]/10 h-[500px] flex flex-col"
      >
        <div className="relative h-[220px] w-full overflow-hidden flex-shrink-0">
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.7 }}
            src={news.picture || "/default-news.jpg"}
            alt={news.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-60" />
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <img
                src={news.userAvatar || "/avatar.jpg"}
                alt={news.userName || "Admin"}
                className="w-8 h-8 rounded-full border-2 border-[#FF009F]/20"
              />
              <span>{news.userName || "Admin"}</span>
            </div>
            <span>•</span>
            <time>{new Date(news.createDate).toLocaleDateString()}</time>
          </div>

          <h2
            className="text-xl font-bold mb-3 text-white group-hover:text-[#FF009F] 
            transition-colors duration-300 line-clamp-2"
          >
            {news.title}
          </h2>

          <p className="text-gray-400 line-clamp-3 mb-4 text-sm leading-relaxed flex-grow">
            {news.content}
          </p>

          <motion.div
            className="flex items-center text-[#FF009F] text-sm font-medium 
              group-hover:text-[#D1007F] mt-auto"
            whileHover={{ x: 5 }}
          >
            Read more
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </Link>
  </motion.div>
);

export default NewsPage;
