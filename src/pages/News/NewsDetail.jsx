import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, Share2, BookmarkPlus } from "lucide-react";
import NewsApi from "../../apis/News/news";
import Loading from "../../components/Loading/Loading";
import { notification } from "antd";

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        const response = await NewsApi.getNewsById(id);

        if (response.success) {
          setNews(response.data);
        } else {
          throw new Error(response.message || "News not found");
        }
      } catch (error) {
        notification.error({
          message: "Error",
          description: error.message || "Failed to fetch news details",
        });
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
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <HeroSection news={news} />
      <ContentSection news={news} />
    </div>
  );
};

const EmptyState = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center text-gray-400 px-4"
    >
      <h2 className="text-2xl font-bold mb-4">News not found</h2>
      <p className="mb-8">
        The article you're looking for doesn't exist or has been removed.
      </p>
      <Link
        to="/news"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF009F] text-white 
          rounded-full hover:bg-[#D1007F] transition-colors duration-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to News
      </Link>
    </motion.div>
  </div>
);

const HeroSection = ({ news }) => (
  <div className="relative h-[60vh] w-full">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0"
    >
      <img
        src={news.picture || "/default-news.jpg"}
        alt={news.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 via-gray-900/60 to-gray-900" />
    </motion.div>

    <div className="absolute bottom-0 left-0 right-0 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/news"
            className="flex items-center gap-2 text-gray-300 hover:text-white 
              transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to News
          </Link>
          <div className="flex-grow" />
          <ActionButton icon={<Share2 />} label="Share" />
          <ActionButton icon={<BookmarkPlus />} label="Save" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {news.title}
        </h1>

        <div className="flex items-center gap-6 text-gray-300">
          <AuthorInfo news={news} />
          <DateInfo date={news.createDate} />
        </div>
      </motion.div>
    </div>
  </div>
);

const ActionButton = ({ icon, label }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 
      backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-colors duration-300"
  >
    {icon}
    {label}
  </motion.button>
);

const AuthorInfo = ({ news }) => (
  <div className="flex items-center gap-3">
    <img
      src="/avatar.jpg"
      alt={news.userName}
      className="w-10 h-10 rounded-full border-2 border-[#FF009F]/20"
    />
    <div>
      <div className="font-medium text-white">{news.userName || "Admin"}</div>
      <div className="text-sm text-gray-400">Content Manager</div>
    </div>
  </div>
);

const DateInfo = ({ date }) => (
  <div className="flex items-center gap-2">
    <Calendar className="w-5 h-5" />
    <time className="text-sm">
      {new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </time>
  </div>
);

const ContentSection = ({ news }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="max-w-4xl mx-auto px-4 py-12"
  >
    <div className="prose prose-lg prose-invert max-w-none">
      <p className="text-gray-300 leading-relaxed whitespace-pre-line text-lg">
        {news.content}
      </p>
    </div>
  </motion.div>
);

export default NewsDetail;
