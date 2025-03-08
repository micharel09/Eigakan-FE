import React from "react";
import MovieList from "./MovieList";

// Cập nhật lại danh sách thể loại phù hợp với API
const genres = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 3, name: "Animation" },
  { id: 4, name: "Comedy" },
  { id: 5, name: "Horror" },
  { id: 6, name: "Mystery" },
  { id: 7, name: "Science Fiction (Sci-Fi)" },
];

function GenreMovieList() {
  return (
    <div className="space-y-8">
      {genres.map((genre) => (
        <div className="px-8 md:px-16" key={genre.id}>
          <h2 className="text-[20px] text-white font-bold mb-4">
            {genre.name}
          </h2>
          <MovieList genreName={genre.name} />
        </div>
      ))}
    </div>
  );
}

export default GenreMovieList;
