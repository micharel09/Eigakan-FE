import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import {
  PlayCircle,
  ChevronRight,
  Star,
  Film,
  Award,
  Tv,
  Heart,
  Zap,
  Clock,
} from "lucide-react";
import FadeInSection from "../../components/Homepage/FadeInSection";

const HomePage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    navigate("/signup?email=" + email);
  };

  // Màu gradient cho các thể loại phim
  const genreGradients = [
    "from-red-600 to-red-900",
    "from-purple-600 to-purple-900",
    "from-pink-500 to-pink-800",
    "from-yellow-500 to-yellow-800",
    "from-blue-500 to-blue-800",
    "from-green-500 to-green-800",
    "from-indigo-500 to-indigo-800",
    "from-orange-500 to-orange-800",
  ];

  // Icon cho các thể loại
  const genreIcons = [
    <Zap className="w-8 h-8" />,
    <Film className="w-8 h-8" />,
    <Heart className="w-8 h-8" />,
    <Star className="w-8 h-8" />,
    <Tv className="w-8 h-8" />,
    <Film className="w-8 h-8" />,
    <Film className="w-8 h-8" />,
    <Clock className="w-8 h-8" />,
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Eigakan - Premium Movie Streaming Platform</title>
        <meta
          name="description"
          content="Discover unlimited entertainment with Eigakan - Stream thousands of high-quality movies and TV shows anytime, anywhere."
        />
      </Helmet>

      {/* Hero Section - Đẩy lên trên cùng, không có padding-top */}
      <div className="relative h-screen w-full -mt-16 pt-16">
        {/* Background với overlay gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="hero.jpg"
            alt="Eigakan background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Discover Unlimited Entertainment
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Thousands of high-quality movies and TV shows, constantly updated
              and ad-free.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/homescreen"
                className="flex items-center gap-2 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white 
                          px-6 py-3 rounded-full hover:shadow-[0_0_15px_rgba(255,0,159,0.5)] transition-all 
                          duration-300 font-semibold text-lg transform hover:translate-y-[-2px]"
              >
                <PlayCircle className="w-5 h-5" />
                Watch Now
              </Link>
              <Link
                to="/subscription-plans"
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20
                          text-white px-6 py-3 rounded-full hover:bg-white/20 transition-all 
                          duration-300 font-medium"
              >
                Get VIP Access
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronRight className="w-8 h-8 rotate-90 text-[#FF009F]" />
        </motion.div>
      </div>

      {/* Features Section */}
      <FadeInSection>
        <div className="py-20 bg-gradient-to-b from-black to-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why Choose Eigakan?</h2>
              <div className="h-1 w-24 bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Film className="w-10 h-10 text-[#FF009F]" />,
                  title: "Diverse Library",
                  description:
                    "Thousands of movies and TV shows across various genres, catering to all preferences.",
                },
                {
                  icon: <Star className="w-10 h-10 text-[#FF009F]" />,
                  title: "Premium Quality",
                  description:
                    "Experience movies with 4K resolution and immersive surround sound.",
                },
                {
                  icon: <Award className="w-10 h-10 text-[#FF009F]" />,
                  title: "Exclusive Content",
                  description:
                    "Enjoy exclusive movies and series only available on Eigakan.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 hover:bg-gray-800/80 transition-all duration-300 hover:transform hover:scale-105 border border-gray-700/30"
                >
                  <div className="mb-4 bg-gradient-to-br from-[#FF009F]/20 to-[#FF6B9F]/20 p-4 rounded-full inline-block">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Popular Categories */}
      <FadeInSection>
        <div className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center">
              Explore by Genre
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "Action" },
                { name: "Horror" },
                { name: "Romance" },
                { name: "Comedy" },
                { name: "Sci-Fi" },
                { name: "Animation" },
                { name: "Drama" },
                { name: "Documentary" },
              ].map((genre, index) => (
                <Link
                  key={index}
                  to={`/genre/${genre.name}`}
                  className="relative overflow-hidden rounded-xl aspect-video group"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${genreGradients[index]} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}
                  ></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <div className="mb-2 opacity-70 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 p-3 rounded-full">
                      {genreIcons[index]}
                    </div>
                    <h3 className="text-xl font-bold text-center group-hover:scale-110 transition-transform duration-300">
                      {genre.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* Testimonials */}
      <FadeInSection>
        <div className="py-20 bg-gradient-to-b from-gray-900 to-black">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-12 text-center">
              What Our Users Say
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  role: "VIP Member",
                  quote:
                    "Eigakan provides an amazing movie experience with crisp image quality and a diverse film library.",
                },
                {
                  role: "Member",
                  quote:
                    "The user-friendly interface and smart movie recommendations help me always find content that matches my preferences.",
                },
                {
                  role: "VIP Member",
                  quote:
                    "4K movie quality and no advertisements make my viewing experience perfect.",
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/30 hover:border-[#FF009F]/30 transition-colors duration-300 hover:bg-gray-800/50"
                >
                  <div className="mb-6 text-center">
                    <span className="inline-block bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white px-4 py-1 rounded-full text-sm font-medium">
                      {testimonial.role}
                    </span>
                  </div>
                  <p className="text-gray-300 italic text-center">
                    "{testimonial.quote}"
                  </p>
                  <div className="mt-6 flex justify-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* CTA Section */}
      <FadeInSection>
        <div className="py-20 bg-gradient-to-r from-[#FF009F]/20 to-black">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Start Your Experience?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Sign up today to discover unlimited entertainment with Eigakan.
            </p>

            <form
              onSubmit={handleFormSubmit}
              className="flex flex-col md:flex-row gap-4 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 outline-none focus:border-[#FF009F] transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#FF009F] to-[#FF6B9F] text-white px-6 py-3 rounded-full hover:shadow-[0_0_15px_rgba(255,0,159,0.5)] transition-all duration-300 font-semibold"
              >
                Get Started
              </button>
            </form>
          </div>
        </div>
      </FadeInSection>
    </div>
  );
};

export default HomePage;
