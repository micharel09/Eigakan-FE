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
    <div className="w-full">
      <Helmet>
        <title>Watch {movie.title} - Eigakan</title>
      </Helmet>
      <div className="w-full">
        <div className="w-full h-[calc(100vh-200px)] bg-black">
          <ReactPlayer
            url={PLACEHOLDER_VIDEO_URL}
            width="100%"
            height="100%"
            controls
            playing
          />
        </div>
        <div className="px-4 py-4">
          <h1 className="text-3xl font-bold">{movie.title}</h1>
          <div className="bg-gray-800 p-4 rounded-lg mt-4">
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

          {/* Rating and Comments Section */}
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Đánh giá & Bình luận</h2>

            {/* Rating Section */}
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <div className="flex items-center mb-4">
                <div className="text-xl mr-4">Đánh giá:</div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="text-2xl text-yellow-400 hover:text-yellow-300"
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="mb-4">
                <textarea
                  className="w-full p-3 rounded bg-gray-700 text-white"
                  rows="3"
                  placeholder="Viết bình luận của bạn..."
                ></textarea>
                <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Gửi bình luận
                </button>
              </div>

              {/* Sample Comments */}
              <div className="space-y-4">
                <div className="border-b border-gray-700 pb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gray-600 rounded-full mr-2"></div>
                    <div>
                      <div className="font-bold">Người dùng 1</div>
                      <div className="text-sm text-gray-400">2 giờ trước</div>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Phim rất hay, diễn viên đóng xuất sắc!
                  </p>
                </div>

                <div className="border-b border-gray-700 pb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gray-600 rounded-full mr-2"></div>
                    <div>
                      <div className="font-bold">Người dùng 2</div>
                      <div className="text-sm text-gray-400">5 giờ trước</div>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Cốt truyện rất cuốn, mong chờ phần tiếp theo!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
