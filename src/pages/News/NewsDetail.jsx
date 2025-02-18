import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spin } from "antd";
import NewsApi from "../../apis/News/news";
import Loading from "../../components/Loading/Loading";

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        const response = await NewsApi.getNewsById(id);
        if (response?.data?.success) {
          setNews(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching news detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <h2 className="text-2xl font-bold mb-2">News not found</h2>
          <p>
            The article you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full">
        {/* Hero Image */}
        <div className="absolute inset-0">
          <img
            src={news.picture || "/default-news.jpg"}
            alt={news.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 via-gray-900/60 to-gray-900" />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-12 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {news.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-300">
            <div className="flex items-center gap-3">
              <img
                src="/avatar.jpg"
                alt={news.userName}
                className="w-10 h-10 rounded-full border-2 border-red-500/20"
              />
              <div>
                <div className="font-medium text-white">
                  {news.userName || "Admin"}
                </div>
                <div className="text-sm text-gray-400">Content Manager</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <time className="text-sm">
                {new Date(news.createDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Main Content */}
        <div className="prose prose-lg prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed whitespace-pre-line text-lg">
            {news.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
