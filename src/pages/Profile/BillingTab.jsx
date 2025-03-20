import { useState, useEffect } from "react";
import { Pagination, Tag, Card, Spin } from "antd";
import subscriptionService from "../../apis/Subscription/subscription";

const PAGE_SIZE = 8;

const BillingTab = () => {
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionHistory = async () => {
      setLoading(true);
      try {
        const response = await subscriptionService.getAllPurchaseHistory(currentPage, PAGE_SIZE);
        if (response.success) {
          setSubscriptionData(response.data.subscriptionPurchase || []);
        }
      } catch (error) {
        console.error("Error fetching subscription history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionHistory();
  }, [currentPage]);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {subscriptionData.length > 0 ? (
            subscriptionData.map((subscription) => (
              <Card key={subscription.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">Order ID: {subscription.id}</h3>
                    <p>Purchase date: {new Date(subscription.purchaseDate).toLocaleDateString()}</p>
                    <p>Expired date: {new Date(subscription.expiredDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold mb-2">
                      Total: {subscription.totalPrice.toLocaleString()} đ
                    </p>
                    <Tag
                      className={`${
                        subscription.status === "Active"
                          ? "bg-green-100 text-green-500 border border-green-500"
                          : "bg-red-100 text-red-500 border border-red-500"
                      }`}
                    >
                      {subscription.status}
                    </Tag>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center text-gray-500">No subscription history found.</div>
          )}

          {/* Pagination */}
          {subscriptionData.length > 0 && (
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={subscriptionData.length}
              onChange={setCurrentPage}
              className="flex justify-center mt-4"
            />
          )}
        </>
      )}
    </div>
  );
};

export default BillingTab;
