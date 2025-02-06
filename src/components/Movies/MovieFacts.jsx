import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import GlobalApi from "../Homepage/GlobalApi";

const MovieFacts = () => {
  const { movieId } = useParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMovieDetails();
  }, [movieId]);

  const getMovieDetails = async () => {
    setLoading(true);
    try {
      const data = await GlobalApi.getMovieDetails(movieId);
      setMovieDetails(data);
    } catch (error) {
      console.error("Error fetching movie details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Movie Facts</h2>
        <div className="text-center text-gray-400">Loading movie facts...</div>
      </div>
    );
  }

  const facts = [
    {
      id: 1,
      icon: "🎬",
      title: "Production",
      content: movieDetails?.production_companies
        ?.map((company) => company.name)
        .join(", "),
    },
    {
      id: 2,
      icon: "💰",
      title: "Budget",
      content: movieDetails?.budget
        ? `$${(movieDetails.budget / 1000000).toFixed(1)}M`
        : "N/A",
    },
    {
      id: 3,
      icon: "🎯",
      title: "Revenue",
      content: movieDetails?.revenue
        ? `$${(movieDetails.revenue / 1000000).toFixed(1)}M`
        : "N/A",
    },
    {
      id: 4,
      icon: "⭐",
      title: "Rating",
      content: `${movieDetails?.vote_average?.toFixed(1)}/10 (${
        movieDetails?.vote_count
      } votes)`,
    },
    {
      id: 5,
      icon: "📅",
      title: "Release Date",
      content: movieDetails?.release_date
        ? new Date(movieDetails.release_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A",
    },
    {
      id: 6,
      icon: "⏱️",
      title: "Runtime",
      content: movieDetails?.runtime
        ? `${movieDetails.runtime} minutes`
        : "N/A",
    },
    {
      id: 7,
      icon: "🌍",
      title: "Countries",
      content: movieDetails?.production_countries
        ?.map((country) => country.name)
        .join(", "),
    },
    {
      id: 8,
      icon: "🗣️",
      title: "Languages",
      content: movieDetails?.spoken_languages
        ?.map((lang) => lang.english_name)
        .join(", "),
    },
  ];

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Movie Facts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {facts.map((fact) => (
          <div
            key={fact.id}
            className="bg-gray-900/50 p-4 rounded-lg backdrop-blur-sm hover:bg-gray-900/70 transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{fact.icon}</span>
              <div>
                <h3 className="font-semibold text-white mb-1">{fact.title}</h3>
                <p className="text-sm text-gray-400">
                  {fact.content || "Not Available"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieFacts;
