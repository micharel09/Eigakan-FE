import React from "react";
import MovieList from "./MovieList";

// Định nghĩa các thể loại phim
const genres = [
  { id: 1, name: "Action" },
  { id: 2, name: "Comedy" },
  { id: 3, name: "Horror" },
  { id: 4, name: "Drama" },
  { id: 5, name: "Sci-Fi" },
];

function GenreMovieList() {
  return (
    <div className="space-y-8">
      {genres.map(
        (genre, index) =>
          index <= 4 && (
            <div className="px-8 md:px-16" key={genre.id}>
              <h2 className="text-[20px] text-white font-bold mb-4">
                {genre.name}
              </h2>
              <MovieList genreName={genre.name} />
            </div>
          )
      )}
    </div>
  );
}

export default GenreMovieList;
