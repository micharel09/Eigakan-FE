import { useState, useEffect } from "react";
import { Pagination, Tag, Button, Spin } from "antd";
import movieHistoryService from "../../apis/MovieHistory/MovieHistory";
import { Link } from "react-router-dom";

const PAGE_SIZE = 3;

const OrderHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [movieHistory, setMovieHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieHistory = async () => {
      setLoading(true);
      try {
        const response = await movieHistoryService.getAllListMoviesHistory(currentPage, PAGE_SIZE);
        if (response.status === 200) {
          setMovieHistory(response.data.movieHistories || []);
          setTotal(response.data.total || 0); // Lưu tổng số lịch sử phim
        }
      } catch (error) {
        console.error("Error fetching subscription history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieHistory();
  }, [currentPage]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {movieHistory.length > 0 ? (
            movieHistory.map((movie) => (
              <div key={movie.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <img src={movie.movies.medias[0].url} alt="movie" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 flex justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-black">{movie.movies.title}</span>
                        <Tag>{movie.type}</Tag>
                      </div>
                      <p className="text-sm text-gray-500 mt-7">Watched date: {new Date(movie.createDate).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <Button type="link" className="mt-5 p-0">
                        <Link to={`/movie/${movie.movies.id}`}>See movie Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">No movie history found.</div>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={total} // Sử dụng total từ API
              onChange={setCurrentPage}
              className="flex justify-center mt-4"
            />
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistory;
