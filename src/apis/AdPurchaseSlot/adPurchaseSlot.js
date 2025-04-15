import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AD_PURCHASE_SLOT;
const TRANSACTION_URL = API_URLS.AD_PURCHASE_TRANSACTION;

const adPurchaseSlotService = {
  getAdPurchaseSlotsByUserId: (page = 1, pageSize = 5) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/AdPurchaseByUserId?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  getAllAdPurchaseSlotsByUserId: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/AdPurchaseByUserId?page=1&pageSize=1000`,
        { headers }
      );
      return response.data;
    }),

  getAdPurchaseSlotById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/${id}`, {
        headers
      });
      return response.data;
    }),

  getPublicAdPurchaseSlotById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching public ad purchase slot:", error);
      return { success: false, data: null, message: error.message };
    }
  },

  createAdPurchaseSlot: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URL, data, {
        headers
      });
      return response.data;
    }),

  updateAdPurchaseSlot: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(
        `${API_URL}/${id}`,
        data,
        { headers }
      );
      return response.data;
    }),

  deleteAdPurchaseSlot: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(
        `${API_URL}/${id}`,
        { headers }
      );
      return response.data;
    }),

  getAdPurchaseTransactions: (page = 1, pageSize = 5) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${TRANSACTION_URL}/AdPurchaseTransactionByUser`,
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
        `${TRANSACTION_URL}/AdPurchaseTransactionByUser`,
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
        `${TRANSACTION_URL}/${id}`,
        { headers }
      );
      return response.data;
    })
};

export default adPurchaseSlotService; 