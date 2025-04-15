import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const adSlotService = {
  // AdSlot APIs
  getAllAdSlots: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_SLOT}`, { headers });
      return response.data;
    }),

  getAdSlotById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_SLOT}/${id}`, { headers });
      return response.data;
    }),

  createAdSlot: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${API_URLS.AD_SLOT}`, data, { headers });
      return response.data;
    }),

  updateAdSlot: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${API_URLS.AD_SLOT}/${id}`, data, {
        headers,
      });
      return response.data;
    }),

  deleteAdSlot: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${API_URLS.AD_SLOT}/${id}`, {
        headers,
      });
      return response.data;
    }),

  // AdSlotTime APIs
  getAllAdSlotTimes: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_SLOT_TIME}`, { headers });
      return response.data;
    }),

  getAdSlotTimeById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_SLOT_TIME}/${id}`, { headers });
      return response.data;
    }),

  createAdSlotTime: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${API_URLS.AD_SLOT_TIME}`, data, {
        headers,
      });
      return response.data;
    }),

  updateAdSlotTime: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${API_URLS.AD_SLOT_TIME}/${id}`, data, {
        headers,
      });
      return response.data;
    }),

  deleteAdSlotTime: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${API_URLS.AD_SLOT_TIME}/${id}`, {
        headers,
      });
      return response.data;
    }),

  // AdSlotTimeRange APIs
  getAllAdSlotTimeRanges: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_SLOT_TIME_RANGE}`, {
        headers,
      });
      return response.data;
    }),

  getAdSlotTimeRangeById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_SLOT_TIME_RANGE}/${id}`, { headers });
      return response.data;
    }),

  createAdSlotTimeRange: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${API_URLS.AD_SLOT_TIME_RANGE}`, data, {
        headers,
      });
      return response.data;
    }),

  updateAdSlotTimeRange: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(
        `${API_URLS.AD_SLOT_TIME_RANGE}/${id}`,
        data,
        { headers }
      );
      return response.data;
    }),

  deleteAdSlotTimeRange: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${API_URLS.AD_SLOT_TIME_RANGE}/${id}`, {
        headers,
      });
      return response.data;
    }),

  // AdSlotPayment APIs
  createAdPayment: (adSlotTimeId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${API_URLS.AD_PURCHASE_TRANSACTION}`,
        {
          adSlotTimeId,
          redirectUrl: `${window.location.origin}/payment-success-adslot`,
        },
        { headers }
      );
      return response.data;
    }),

  // AdPackage APIs
  getAllAdPackages: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_PACKAGE}`, { headers });
      return response.data;
    }),

  // Ad Purchase Transaction API
  createAdPurchaseTransaction: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${API_URLS.AD_PURCHASE_TRANSACTION}`,
        data,
        { headers }
      );
      return response.data;
    }),

  // Payment verification
  verifyAdPayment: (queryString) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.AD_PURCHASE_TRANSACTION}/payment_return?${queryString}`,
        { headers }
      );
      return response.data;
    }),
};

export default adSlotService; 