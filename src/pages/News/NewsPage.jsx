import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SearchOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import NewsApi from "../../apis/News/news";
import { notification } from "antd";

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

        const startIndex = 0;
        const endIndex = page * pageSize;
        const paginatedNews = activeNews.slice(startIndex, endIndex);

        setNews((prevNews) =>
          page === 1 ? paginatedNews : [...prevNews, ...paginatedNews]
        );

        setHasMore(endIndex < activeNews.length);
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

  useEffect(() => {
    fetchNews();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
  };

  return (
    <div className="min-h-screen bg-black">
      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
      />
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
  <div className="relative py-16 px-4 overflow-hidden">
    <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {news.map((item, index) => (
          <NewsCard key={item.id} news={item} index={index} />
        ))}
      </AnimatePresence>
    </div>

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
                src="/avatar.jpg"
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
