import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const adSlotService = {
  // AdSlot APIs
  getAllAdSlots: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(API_URLS.AD_SLOT, { 
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        } 
      });
      return response.data;
    }),

  createAdSlot: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URLS.AD_SLOT, data, { 
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        } 
      });
      return response.data;
    }),

  updateAdSlot: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${API_URLS.AD_SLOT}/${id}`, data, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    }),

  deleteAdSlot: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${API_URLS.AD_SLOT}/${id}`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    }),

  // AdSlotTime APIs
  getAllAdSlotTimes: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(API_URLS.AD_SLOT_TIME, { 
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        } 
      });
      return response.data;
    }),

  createAdSlotTime: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URLS.AD_SLOT_TIME, data, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    }),

  updateAdSlotTime: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${API_URLS.AD_SLOT_TIME}/${id}`, data, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    }),

  deleteAdSlotTime: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${API_URLS.AD_SLOT_TIME}/${id}`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    }),

  // AdSlotTimeRange APIs
  getAllAdSlotTimeRanges: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(API_URLS.AD_SLOT_TIME_RANGE, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    }),

  createAdSlotTimeRange: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URLS.AD_SLOT_TIME_RANGE, data, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    }),

  updateAdSlotTimeRange: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(
        `${API_URLS.AD_SLOT_TIME_RANGE}/${id}`,
        data,
        { 
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );
      return response.data;
    }),

  deleteAdSlotTimeRange: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${API_URLS.AD_SLOT_TIME_RANGE}/${id}`, {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    }),

  // AdSlotPayment APIs
  createAdPayment: (adSlotTimeId) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.post(
          API_URLS.AD_PURCHASE_TRANSACTION,
          {
            adSlotTimeId,
            redirectUrl: `${window.location.origin}/payment-success-adslot`,
          },
          { 
            headers: {
              ...headers,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            validateStatus: (status) => status < 500 // Accept status codes < 500
          }
        );
        // Log response for debugging
        console.log('API Response:', response);
        return response.data;
      } catch (error) {
        console.error('API Error:', error);
        throw error.response?.data || error.message;
      }
    }),

  // AdPackage APIs
  getAllAdPackages: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(API_URLS.AD_PACKAGE, { 
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        } 
      });
      return response.data;
    }),

  // Ad Purchase Transaction API
  createAdPurchaseTransaction: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        API_URLS.AD_PURCHASE_TRANSACTION,
        data,
        { 
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );
      return response.data;
    }),

  // Payment verification
  verifyAdPayment: (queryString) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.AD_PURCHASE_TRANSACTION}/payment_return?${queryString}`,
        { 
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );
      return response.data;
    }),
};

export default adSlotService; 