import React, { useState, useEffect } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Spin, Tag } from "antd";
import NewsApi from "../../apis/News/news";
import { Link } from "react-router-dom";
import Loading from "../../components/Loading/Loading";

const categories = ["All", "Reviews", "Film News", "Industry Updates"];

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 6;

  // Fetch news data
  const fetchNews = async () => {
    try {
      const response = await NewsApi.getNews(page, pageSize);
      if (response?.data?.success) {
        // Chỉ lấy những news có status Active
        const activeNews = response.data.data.filter(
          (item) => item.status === "Active"
        );

        if (page === 1) {
          setNews(activeNews); // Reset list nếu là page đầu
        } else {
          setNews((prev) => [...prev, ...activeNews]);
        }

        // Kiểm tra nếu không còn data để load
        if (activeNews.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [page]);

  const NewsCard = ({ news }) => (
    <Link to={`/news/${news.id}`}>
      <div
        className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden 
        border border-gray-700/50 hover:border-red-500/50 transition-all duration-500
        hover:shadow-xl hover:shadow-red-500/10 h-[500px] flex flex-col"
      >
        {/* Image container */}
        <div className="relative h-[220px] w-full overflow-hidden flex-shrink-0">
          <img
            src={news.picture || "/default-news.jpg"}
            alt={news.title}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-60" />
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
          {/* Meta info */}
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <img
                src="/avatar.jpg"
                alt="Author"
                className="w-8 h-8 rounded-full border-2 border-red-500/20"
              />
              <span>{news.userName || "Admin"}</span>
            </div>
            <span>•</span>
            <time>{new Date(news.createDate).toLocaleDateString()}</time>
          </div>

          {/* Title */}
          <h2
            className="text-xl font-bold mb-3 text-white group-hover:text-red-500 
            transition-colors duration-300 line-clamp-2"
          >
            {news.title}
          </h2>

          {/* Excerpt */}
          <p className="text-gray-400 line-clamp-3 mb-4 text-sm leading-relaxed flex-grow">
            {news.content}
          </p>

          {/* Read more */}
          <div className="flex items-center text-red-500 text-sm font-medium group-hover:text-red-400 mt-auto">
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
          </div>
        </div>
      </div>
    </Link>
  );

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && page === 1) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative py-12 px-4overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5" />

        <div className="relative max-w-7xl mx-auto text-center">
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent 
            bg-gradient-to-r from-red-500 via-red-400 to-red-500"
          >
            Eigakan News
          </h1>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
            Stay updated with the latest news, reviews, and insights from the
            world of cinema
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Search news..."
              className="w-full px-6 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 
                rounded-full text-gray-200 placeholder-gray-500 outline-none focus:border-red-500
                transition-all duration-300 shadow-lg"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3
              bg-red-500 hover:bg-red-600 text-white rounded-full 
              transition-all duration-300 transform hover:scale-105"
            >
              <SearchOutlined className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>

        {/* Load more button */}
        {news.length > 0 && hasMore && (
          <div className="flex justify-center mt-16">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full
                transition-all duration-300 transform hover:scale-105 font-medium
                flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg hover:shadow-red-500/25"
            >
              {loading ? (
                <Spin size="small" />
              ) : (
                <>
                  Load More
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
