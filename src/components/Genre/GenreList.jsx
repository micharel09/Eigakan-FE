import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Spin } from "antd";
import genreService from "../../apis/Genre/genre";

const GenreList = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      try {
        const response = await genreService.getGenres();
        if (response.data) {
          setGenres(response.data);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {genres.map((genre) => (
        <Link
          key={genre.id}
          to={`/genre/${genre.name}`}
          className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-center transition-transform hover:scale-105"
        >
          <h3 className="text-white font-medium hover:text-[#FF009F] transition-colors">
            {genre.name}
          </h3>
          <p className="text-gray-400 text-sm mt-2 line-clamp-2">
            {genre.description || `Browse ${genre.name} movies`}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default GenreList;
