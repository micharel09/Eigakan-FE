import React, { useEffect, useState } from "react";
import {
  useParams,
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Clock, Star, ChevronRight } from "lucide-react";
import { Spin } from "antd";
import movieService from "../../apis/Movie/movie";
import genreService from "../../apis/Genre/genre";
import Navbar from "../../components/Header/Navbar";

const GenrePage = () => {
  const { genreName } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState(null);
  const [allGenres, setAllGenres] = useState([]);
  const [isChangingGenre, setIsChangingGenre] = useState(false);
  const [currentGenre, setCurrentGenre] = useState(genreName);

  const fetchMovies = async (genre) => {
    setLoading(true);
    try {
      const response = await movieService.getMovies(1, 24, genre);
      if (response.success && response.movies) {
        setMovies(response.movies);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await genreService.getGenres();
        if (response.data) {
          setAllGenres(response.data);
          const currentGenre = response.data.find(
            (g) => g.name.toLowerCase() === genreName.toLowerCase()
          );
          setGenre(currentGenre);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };

    fetchGenres();
    setCurrentGenre(genreName);
  }, [genreName]);

  useEffect(() => {
    if (genreName) {
      fetchMovies(genreName);
    }
  }, [genreName]);

  const handleGenreChange = async (newGenre) => {
    setIsChangingGenre(true);
    setCurrentGenre(newGenre);
    await fetchMovies(newGenre);
    window.history.pushState(null, "", `/genre/${newGenre}${location.search}`);
    setIsChangingGenre(false);
  };

  return (
    <div className="min-h-screen bg-[#181818]">
      <Helmet>
        <title>
          {currentGenre ? `${currentGenre} Movies` : "Genre"} - Eigakan
        </title>
        <meta
          name="description"
          content={`Watch the best ${currentGenre} movies in HD quality on Eigakan`}
        />
      </Helmet>

      <PageHeader genre={genre} genreName={currentGenre} />
      <GenreNavigation
        allGenres={allGenres}
        currentGenre={currentGenre}
        onGenreChange={handleGenreChange}
        isChanging={isChangingGenre}
      />
      <MoviesGrid movies={movies} loading={loading || isChangingGenre} />
      <Navbar />
    </div>
  );
};

const PageHeader = ({ genre, genreName }) => (
  <div className="relative pt-24 pb-12 px-4 md:px-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-2 mb-6">
        <Film className="w-6 h-6 text-[#FF009F]" />
        <nav className="flex items-center gap-2 text-sm text-gray-400">
          <Link to="/genres" className="hover:text-white transition-colors">
            Genres
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{genreName}</span>
        </nav>
      </div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-white mb-4"
      >
        {genreName} <span className="text-[#FF009F]">Movies</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 max-w-3xl"
      >
        {genre?.description ||
          `Explore our collection of ${genreName} movies. Find the best ${genreName} films to watch online in HD quality.`}
      </motion.p>
    </motion.div>
  </div>
);

const GenreNavigation = ({
  allGenres,
  currentGenre,
  onGenreChange,
  isChanging,
}) => (
  <div className="px-4 md:px-8 mb-8">
    <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-hide">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex space-x-2 pb-2"
      >
        {allGenres.map((genre) => (
          <GenreButton
            key={genre.id}
            genre={genre}
            isActive={genre.name.toLowerCase() === currentGenre.toLowerCase()}
            onClick={() => onGenreChange(genre.name)}
            disabled={isChanging}
          />
        ))}
      </motion.div>
    </div>
  </div>
);

const GenreButton = ({ genre, isActive, onClick, disabled }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300
      ${
        isActive
          ? "bg-[#FF009F] text-white shadow-lg shadow-[#FF009F]/25"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
      }
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    {genre.name}
  </motion.button>
);

const MoviesGrid = ({ movies, loading }) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center py-20"
      >
        <Spin size="large" />
      </motion.div>
    );
  }

  if (!movies.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <h3 className="text-xl text-gray-400">
          No movies found for this genre
        </h3>
      </motion.div>
    );
  }

  return (
    <div className="px-4 md:px-8 pb-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
        >
          <AnimatePresence>
            {movies.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

const MovieCard = ({ movie, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
  >
    <Link to={`/movie/${movie.id}`} className="group relative block">
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-900">
        <img
          src={movie.medias?.[0]?.url || "/placeholder.svg"}
          alt={movie.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        <MovieOverlay movie={movie} />
      </div>
      <h3 className="text-white text-sm font-medium mt-2 line-clamp-2 group-hover:text-[#FF009F] transition-colors duration-300">
        {movie.title}
      </h3>
    </Link>
  </motion.div>
);

const MovieOverlay = ({ movie }) => (
  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
    <div className="absolute inset-0 flex flex-col justify-between p-3">
      <div className="flex justify-between items-start">
        <span className="bg-[#FF009F] text-white text-xs px-2 py-1 rounded">
          {movie.quality || "HD"}
        </span>
        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {movie.duration} min
        </span>
      </div>
      <div>
        <h3 className="text-white text-sm font-medium line-clamp-2 mb-1">
          {movie.title}
        </h3>
        <MovieMetadata movie={movie} />
      </div>
    </div>
  </div>
);

const MovieMetadata = ({ movie }) => (
  <div className="space-y-1 text-xs text-gray-300">
    <div className="flex items-center gap-2">
      <span>{movie.releaseYear}</span>
      {movie.imdbScore && (
        <>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-[#FF009F]" />
            {movie.imdbScore}
          </span>
        </>
      )}
    </div>
    <div className="line-clamp-1">{movie.genreNames}</div>
  </div>
);

export default GenrePage;
