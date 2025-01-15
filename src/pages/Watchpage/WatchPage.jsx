import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import GlobalApi from "../../components/Homepage/GlobalApi";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
// This is a placeholder video URL. Replace it with your actual video source when available.
const PLACEHOLDER_VIDEO_URL =
  "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";

const WatchPage = () => {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const data = await GlobalApi.getMovieDetails(movieId);
        setMovie(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return <div className="text-center p-4">Movie not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Watch {movie.title} - Eigakan</title>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{movie.title}</h1>
        <div className="aspect-video rounded-lg overflow-hidden mb-4">
          <ReactPlayer
            url={PLACEHOLDER_VIDEO_URL}
            width="100%"
            height="100%"
            controls
            playing
          />
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Movie Info</h2>
          <p className="mb-2">
            <span className="font-semibold">Release Date:</span>{" "}
            {new Date(movie.release_date).toLocaleDateString()}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Rating:</span>{" "}
            {movie.vote_average.toFixed(1)} / 10
          </p>
          <p className="mb-2">
            <span className="font-semibold">Overview:</span> {movie.overview}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
