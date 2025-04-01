import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const adPurchaseSlotService = {
  getAdPurchaseSlotsByUserId: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.AD_PURCHASE_SLOT}/AdPurchaseByUserId`,
        {
          params: { page, pageSize },
          headers
        }
      );
      return response.data;
    }),

  getAdPurchaseSlotById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_PURCHASE_SLOT}/${id}`, {
        headers
      });
      return response.data;
    }),

  getPublicAdPurchaseSlotById: async (id) => {
    try {
      const response = await axios.get(`${API_URLS.AD_PURCHASE_SLOT}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching public ad purchase slot:", error);
      return { success: false, data: null, message: error.message };
    }
  },

  createAdPurchaseSlot: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URLS.AD_PURCHASE_SLOT, data, {
        headers
      });
      return response.data;
    }),

  updateAdPurchaseSlot: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(
        `${API_URLS.AD_PURCHASE_SLOT}/${id}`,
        data,
        { headers }
      );
      return response.data;
    }),

  deleteAdPurchaseSlot: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(
        `${API_URLS.AD_PURCHASE_SLOT}/${id}`,
        { headers }
      );
      return response.data;
    }),

  getAdPurchaseTransactions: (page = 1, pageSize = 5) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.AD_PURCHASE_TRANSACTION}/AdPurchaseTransactionByUser`,
        {
          params: { page, pageSize },
          headers
        }
      );
      return response.data;
    }),
    
  getAllAdPurchaseTransactions: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.AD_PURCHASE_TRANSACTION}/AdPurchaseTransactionByUser`,
        {
          params: { page: 1, pageSize: 1000 },
          headers
        }
      );
      return response.data;
    }),

  getAdPurchaseTransactionById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.AD_PURCHASE_TRANSACTION}/${id}`,
        { headers }
      );
      return response.data;
    })
};

export default adPurchaseSlotService; 