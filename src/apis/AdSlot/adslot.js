import axios from "axios";

const BASE_URL = "https://eigakan2222-001-site1.jtempurl.com/api";

/**
 * Helper function to make authenticated API requests
 * @param {Function} apiCall - The API call function to execute
 * @returns {Promise} - The API response
 */
const makeAuthenticatedRequest = async (apiCall) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    return await apiCall(headers);
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const adSlotService = {
  // AdSlot APIs
  getAllAdSlots: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${BASE_URL}/AdSlot`, { headers });
      return response.data;
    }),

  getAdSlotById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${BASE_URL}/AdSlot/${id}`, { headers });
      return response.data;
    }),

  createAdSlot: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${BASE_URL}/AdSlot`, data, { headers });
      return response.data;
    }),

  updateAdSlot: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${BASE_URL}/AdSlot/${id}`, data, {
        headers,
      });
      return response.data;
    }),

  deleteAdSlot: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${BASE_URL}/AdSlot/${id}`, {
        headers,
      });
      return response.data;
    }),

  // AdSlotTime APIs
  getAllAdSlotTimes: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${BASE_URL}/AdSlotTime`, { headers });
      return response.data;
    }),

  getAdSlotTimeById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${BASE_URL}/AdSlotTime/${id}`, { headers });
      return response.data;
    }),

  createAdSlotTime: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${BASE_URL}/AdSlotTime`, data, {
        headers,
      });
      return response.data;
    }),

  updateAdSlotTime: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${BASE_URL}/AdSlotTime/${id}`, data, {
        headers,
      });
      return response.data;
    }),

  deleteAdSlotTime: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${BASE_URL}/AdSlotTime/${id}`, {
        headers,
      });
      return response.data;
    }),

  // AdSlotTimeRange APIs
  getAllAdSlotTimeRanges: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${BASE_URL}/AdSlotTimeRange`, {
        headers,
      });
      return response.data;
    }),

  getAdSlotTimeRangeById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${BASE_URL}/AdSlotTimeRange/${id}`, { headers });
      return response.data;
    }),

  createAdSlotTimeRange: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${BASE_URL}/AdSlotTimeRange`, data, {
        headers,
      });
      return response.data;
    }),

  updateAdSlotTimeRange: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(
        `${BASE_URL}/AdSlotTimeRange/${id}`,
        data,
        { headers }
      );
      return response.data;
    }),

  deleteAdSlotTimeRange: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${BASE_URL}/AdSlotTimeRange/${id}`, {
        headers,
      });
      return response.data;
    }),

  // AdSlotPayment APIs
  createAdPayment: (adSlotTimeId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${BASE_URL}/api/AdPurchaseTransaction`,
        {
          adSlotTimeId,
          redirectUrl: `https://eigakan-fe.vercel.app/payment-success-adslot`,
        },
        { headers }
      );
      return response.data;
    }),

  // AdPackage APIs
  getAllAdPackages: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${BASE_URL}/AdPackage`, { headers });
      return response.data;
    }),

  // Ad Purchase Transaction API
  createAdPurchaseTransaction: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${BASE_URL}/AdPurchaseTransaction`,
        data,
        { headers }
      );
      return response.data;
    }),

  // Payment verification
  verifyAdPayment: (queryString) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${BASE_URL}/AdPurchaseTransaction/payment_return?${queryString}`,
        { headers }
      );
      return response.data;
    }),
};

export default adSlotService; 