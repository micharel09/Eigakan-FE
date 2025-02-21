import { useState } from "react";
import { Pagination, Tag, Button } from "antd";

const orders = [
  { id: "111111", type: "Premium", purchaseDate: "22-09-1999", expiredDate: "22-09-2000", total: 231 },
  { id: "222222", type: "Standard", purchaseDate: "10-05-2005", expiredDate: "10-05-2006", total: 120 },
  { id: "333333", type: "Basic", purchaseDate: "15-03-2010", expiredDate: "15-03-2011", total: 99 },
  { id: "444444", type: "Premium", purchaseDate: "01-01-2015", expiredDate: "01-01-2016", total: 299 },
  { id: "555555", type: "Standard", purchaseDate: "07-07-2020", expiredDate: "07-07-2021", total: 159 },
];

const PAGE_SIZE = 2; // Số đơn hàng mỗi trang

const BillingTab = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedOrders = orders.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-4">
      {paginatedOrders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Order ID: #{order.id}</span>
                <Tag>{order.type}</Tag>
              </div>
              <p className="text-sm text-gray-500 mt-1">Purchase date: {order.purchaseDate}</p>
              <p className="text-sm text-gray-500 mt-1">Expired date: {order.expiredDate}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Total: ${order.total}</p>
              <Button type="link" className="mt-5 p-0">
                See Order Details
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <Pagination
        current={currentPage}
        pageSize={PAGE_SIZE}
        total={orders.length}
        onChange={(page) => setCurrentPage(page)}
        className="flex justify-center mt-4"
      />
    </div>
  );
};

export default BillingTab;
