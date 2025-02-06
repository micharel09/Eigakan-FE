import React from "react";
import { SearchOutlined } from "@ant-design/icons";

const categories = ["All", "Reviews", "Film News", "Industry Updates"];

const NewsPage = () => {
  const dummyNews = [
    {
      id: 1,
      title: "Top 10 Movies of 2024",
      category: "Reviews",
      author: "John Doe",
      date: "March 20, 2024",
      thumbnail: "/news-thumb-1.jpg",
      excerpt:
        "Discover the best films that have graced our screens in 2024 so far...",
    },
    {
      id: 2,
      title: "The Evolution of Cinema Technology",
      category: "Film News",
      author: "Jane Smith",
      date: "March 19, 2024",
      thumbnail: "/news-thumb-2.jpg",
      excerpt:
        "From silent films to digital streaming, explore how technology has transformed cinema...",
    },
    {
      id: 3,
      title: "Behind the Scenes: Making of Blockbuster",
      category: "Behind the Scenes",
      author: "Mike Johnson",
      date: "March 18, 2024",
      thumbnail: "/news-thumb-3.jpg",
      excerpt: "Get an exclusive look at how modern blockbusters are made...",
    },
    {
      id: 4,
      title: "Rising Stars in Hollywood",
      category: "Industry Updates",
      author: "Sarah Wilson",
      date: "March 17, 2024",
      thumbnail: "/news-thumb-4.jpg",
      excerpt:
        "Meet the new generation of actors who are taking Hollywood by storm...",
    },
    // Add more dummy news
  ];

  const NewsCard = ({ news }) => (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-red-500/10 transition-all duration-300 transform hover:-translate-y-1">
      <img
        src={news.thumbnail}
        alt={news.title}
        className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
      />
      <div className="p-6 relative">
        <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
          <span className="px-3 py-1 bg-red-600/10 text-red-500 rounded-full text-xs font-medium">
            {news.category}
          </span>
          •{news.date}
        </div>
        <h2 className="text-2xl font-bold mb-3 text-white hover:text-red-500 transition-colors duration-300 cursor-pointer line-clamp-2">
          {news.title}
        </h2>
        <p className="text-gray-400 mb-6 line-clamp-2">{news.excerpt}</p>
        <div className="flex items-center">
          <img
            src="/avatar.jpg"
            alt={news.author}
            className="w-10 h-10 rounded-full mr-4 border-2 border-red-500/20"
          />
          <div>
            <div className="font-medium text-white">{news.author}</div>
            <div className="text-sm text-gray-400">Content Manager</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#161515]">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
            Eigakan News
          </span>
        </h1>
        <p className="text-gray-400 text-base md:text-lg mb-10 max-w-3xl mx-auto">
          Discover the latest news, reviews, and insights about cinema
        </p>
        <div className="max-w-2xl mx-auto relative group">
          <input
            type="text"
            placeholder="Search news..."
            className="w-full px-6 py-4 bg-gray-900/50 border border-gray-800 rounded-full
              text-gray-200 placeholder-gray-400 outline-none focus:border-red-500
              transition-all duration-300 shadow-lg backdrop-blur-sm
              focus:shadow-red-500/10"
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3
            bg-red-600 text-white rounded-full hover:bg-red-700
            transition-all duration-300 transform hover:scale-105 group-focus-within:bg-red-700"
          >
            <SearchOutlined className="text-lg" />
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {categories.map((category, index) => (
          <button
            key={category}
            className={`px-6 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 font-medium
              ${
                index === 0
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white"
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {dummyNews.map((news) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <button className="px-8 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-300 transform hover:scale-105 font-medium flex items-center gap-2">
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
        </button>
      </div>
    </div>
  );
};

export default NewsPage;
