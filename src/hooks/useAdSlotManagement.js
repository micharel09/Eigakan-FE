import { useState, useEffect, useCallback } from "react";
import { notification } from "antd";
import adPurchaseSlotService from "../apis/AdPurchaseSlot/adPurchaseSlot";
import adMediaCountService from "../apis/AdMedia/adMediaCount";

const useAdSlotManagement = (options = {}) => {
  const {
    pageSize = 5,
    cacheTime = 5 * 60 * 1000, 
    autoRefreshInterval = 5 * 60 * 1000, 
  } = options;

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize,
    total: 0,
  });

  // Data states
  const [adPurchaseSlots, setAdPurchaseSlots] = useState([]);
  const [slotDetails, setSlotDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [adMediaCounts, setAdMediaCounts] = useState({});
  const [lastFetchTime, setLastFetchTime] = useState({});
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const fetchSlotDetails = useCallback(async (slotId) => {
    try {
      const response = await adPurchaseSlotService.getAdPurchaseSlotById(slotId);
      if (response?.success) {
        setSlotDetails((prev) => ({
          ...prev,
          [slotId]: response.data,
        }));
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching slot details:", error);
      return null;
    }
  }, []);

  const fetchAllSlotDetails = useCallback(
    async (slots) => {
      const promises = slots.map((slot) => fetchSlotDetails(slot.id));
      await Promise.all(promises);
    },
    [fetchSlotDetails]
  );

  // Fetch tổng số items
  const fetchTotalItems = useCallback(async () => {
    try {
      const response = await adPurchaseSlotService.getAllAdPurchaseSlotsByUserId();
      if (response?.success) {
        setPagination((prev) => ({
          ...prev,
          total: response.data?.length || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching total items:", error);
    }
  }, []);

  // Fetch data phân trang
  const fetchAdPurchaseSlots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adPurchaseSlotService.getAdPurchaseSlotsByUserId(
        pagination.current,
        pagination.pageSize
      );
      if (response?.success) {
        // Chắc chắn tất cả các slots đều có thuộc tính status
        const slotsWithStatus = (response.data || []).map(slot => ({
          ...slot,
          // Đảm bảo status luôn tồn tại và chính xác
          status: slot.status || "PENDING"
        }));
        
        setAdPurchaseSlots(slotsWithStatus);
        
        // Xây dựng dữ liệu chi tiết ban đầu cho các slots
        const initialSlotDetails = {};
        slotsWithStatus.forEach(slot => {
          initialSlotDetails[slot.id] = slot;
        });
        
        setSlotDetails(prev => ({
          ...prev,
          ...initialSlotDetails
        }));
        
        // Sau đó mới fetch chi tiết
        await fetchAllSlotDetails(slotsWithStatus);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Failed to fetch ad purchase slots",
      });
      setAdPurchaseSlots([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, fetchAllSlotDetails]);

  // Kiểm tra nếu slot có thể tạo ad
  const canCreateAd = useCallback(
    (record) => {
      // Nếu đã có adMedias thì không thể tạo
      if (record?.adMedias?.length > 0) {
        return false;
      }

      // Kiểm tra trạng thái của adSlot
      const slotDetail = slotDetails[record?.id];
      if (slotDetail) {
        return slotDetail.adSlotTime?.adSlot?.status === "ACTIVE";
      }

      // Nếu chưa có slotDetail, trả về false để đảm bảo an toàn
      return false;
    },
    [slotDetails]
  );

  // Fetch media count cho một ad
  const fetchAdMediaCount = useCallback(
    async (adMediaId) => {
      try {
        // Kiểm tra cache
        const now = Date.now();
        if (
          lastFetchTime[adMediaId] &&
          now - lastFetchTime[adMediaId] < cacheTime
        ) {
          return; // Nếu data còn trong thời gian cache thì không fetch lại
        }

        const response = await adMediaCountService.getAdMediaCountByAdMediaId(adMediaId);
        if (response?.success) {
          setAdMediaCounts((prev) => ({
            ...prev,
            [adMediaId]: response.data?.viewCount || 0,
          }));
          setLastFetchTime((prev) => ({
            ...prev,
            [adMediaId]: now,
          }));
        }
      } catch (error) {
        console.error("Error fetching ad media count:", error);
      }
    },
    [lastFetchTime, cacheTime]
  );

  // Fetch tất cả media counts
  const fetchAllAdMediaCounts = useCallback(async () => {
    if (adPurchaseSlots.length > 0) {
      // Lọc ra những ad media cần fetch (hết hạn cache hoặc chưa có data)
      const now = Date.now();
      const adMediasToFetch = adPurchaseSlots
        .filter((slot) => slot.adMedias?.[0]?.id)
        .filter((slot) => {
          const adMediaId = slot.adMedias[0].id;
          return (
            !lastFetchTime[adMediaId] ||
            now - lastFetchTime[adMediaId] >= cacheTime
          );
        })
        .map((slot) => slot.adMedias[0].id);

      // Fetch từng cái một để tránh overload
      for (const adMediaId of adMediasToFetch) {
        await fetchAdMediaCount(adMediaId);
        // Thêm delay nhỏ giữa các request để tránh spam server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }, [adPurchaseSlots, fetchAdMediaCount, lastFetchTime, cacheTime]);

  // Xử lý pagination
  const handlePaginationChange = useCallback((page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize,
    }));
  }, []);

  const handleShowSizeChange = useCallback((current, size) => {
    setPagination((prev) => ({
      ...prev,
      current: 1,
      pageSize: size,
    }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTotalItems();
  }, [fetchTotalItems]);

  // Fetch data khi pagination thay đổi
  useEffect(() => {
    fetchAdPurchaseSlots();
  }, [fetchAdPurchaseSlots]);

  // Fetch ad media counts khi adPurchaseSlots thay đổi
  useEffect(() => {
    fetchAllAdMediaCounts();
  }, [adPurchaseSlots, fetchTrigger, fetchAllAdMediaCounts]);

  // Auto refresh view counts
  useEffect(() => {
    const intervalId = setInterval(() => {
      setFetchTrigger((prev) => prev + 1);
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval]);

  return {
    // Data states
    adPurchaseSlots,
    slotDetails,
    loading,
    adMediaCounts,
    pagination,
    
    // Utility functions
    canCreateAd,
    fetchSlotDetails,
    fetchAdPurchaseSlots,
    
    // Handlers
    handlePaginationChange,
    handleShowSizeChange,
  };
};

export default useAdSlotManagement; 