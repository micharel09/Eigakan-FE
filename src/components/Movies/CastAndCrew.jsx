import React from "react";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import GlobalApi from "../Homepage/GlobalApi";

const CastAndCrew = () => {
  // Lấy movieId từ URL params
  const { movieId } = useParams();
  // State lưu trữ danh sách cast
  const [cast, setCast] = useState([]);

  // Effect để fetch dữ liệu cast khi component mount hoặc movieId thay đổi
  useEffect(() => {
    const getCast = async () => {
      try {
        const resp = await GlobalApi.getMovieCredits(movieId);
        // Chỉ lấy 10 diễn viên đầu tiên để tối ưu hiển thị
        setCast(resp.data.cast.slice(0, 10));
      } catch (error) {
        console.error("Error fetching cast:", error);
      }
    };

    getCast();
  }, [movieId]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-white">Cast & Crew</h2>
      {/* Grid layout responsive: 2 cột trên mobile, 5 cột trên desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cast.map((person) => (
          <div key={person.id} className="group cursor-pointer">
            {/* Card cho mỗi diễn viên */}
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-3">
              {/* Ảnh diễn viên với fallback */}
              <img
                src={
                  person.profile_path
                    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
                    : "/placeholder-cast.png"
                }
                alt={person.name}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                loading="lazy" // Lazy load ảnh
              />
              {/* Overlay khi hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-3 left-3">
                  <span className="text-xs text-white/90">View Profile →</span>
                </div>
              </div>
            </div>
            {/* Thông tin diễn viên */}
            <h3 className="font-medium text-white text-sm mb-1 truncate">
              {person.name}
            </h3>
            <p className="text-sm text-gray-400 truncate">{person.character}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CastAndCrew;
