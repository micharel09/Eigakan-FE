import { useState } from "react";
import { Pagination, Tag, Button } from "antd";

const movies = [
  { fullName: "Tee Yod", type: "Premium", expiredDate: "22-09-2000", image: "https://res.cloudinary.com/dn8bn2sty/image/upload/v1740116537/doiixqftcjvsnrusld89.jpg" },
  { fullName: "Tee Yod", type: "Premium", expiredDate: "22-09-2000", image: "https://res.cloudinary.com/dn8bn2sty/image/upload/v1740116537/doiixqftcjvsnrusld89.jpg" },
  { fullName: "Tee Yod", type: "Premium", expiredDate: "22-09-2000", image: "https://res.cloudinary.com/dn8bn2sty/image/upload/v1740116537/doiixqftcjvsnrusld89.jpg" },
];

const PAGE_SIZE = 2;

const OrderHistory = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedOrders = movies.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-4">
      {paginatedOrders.map((movie) => (
        <div key={movie.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <img src={movie.image} alt="movie" className="w-16 h-16 rounded-lg object-cover" />

            <div className="flex-1 flex justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className=" uppercase text-black">{movie.fullName}</span>
                  <Tag>{movie.type}</Tag>
                </div>
                
                <p className="text-sm text-gray-500 mt-7">Watched date: {movie.expiredDate}</p>
              </div>
              <div className="text-right">

                <Button type="link" className="mt-5 p-0">See movie Details</Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <Pagination
        current={currentPage}
        pageSize={PAGE_SIZE}
        total={movies.length}
        onChange={(page) => setCurrentPage(page)}
        className="flex justify-center mt-4"
      />
    </div>
  );
};

export default OrderHistory;
