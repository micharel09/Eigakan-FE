"use client";

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import movieCountService from "../../../apis/MovieCount/MovieCount";

export default function MovieCount() {
  const { id } = useParams(); 
  const [data, setData] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMovieCount();
  }, [id]); // 🛠️ Gọi lại khi ID thay đổi

  const fetchMovieCount = async () => {
    setLoading(true);
    try {
      const response = await movieCountService.getStatisticMovieCount(id);
      setData(response.data.result); 
    } catch (error) {
      console.error("Failed to fetch movie details", error);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for charts
  const chartData = [
    { name: "Today", views: data.today },
    { name: "This Week", views: data.thisWeek },
    { name: "This Month", views: data.thisMonth },
    { name: "Total", views: data.total },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {chartData.map((item) => (
          <div key={item.name} className="text-center">
            <div className="text-xs text-gray-500">{item.name}</div>
            <div className="font-bold text-gray-800">{loading ? "..." : item.views}</div>
          </div>
        ))}
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "none",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }}
              labelStyle={{ fontWeight: "bold", color: "#333" }}
            />
            <Bar
              dataKey="views"
              fill="#8884d8"
              radius={[4, 4, 0, 0]}
              background={{ fill: "#eee", radius: [4, 4, 0, 0] }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
