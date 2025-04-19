import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const AD_PURCHASE_ITEM_URL = API_URLS.AD_PURCHASE_ITEM;
const AD_PURCHASE_TRANSACTION_URL = API_URLS.AD_PURCHASE_TRANSACTION;
// Removed: const AD_PURCHASE_SLOT_URL = API_URLS.AD_PURCHASE_SLOT;

const adPurchaseService = {
  // ===== AdPurchaseItem API =====
  getAdPurchaseItemsByLogin: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${AD_PURCHASE_ITEM_URL}/GetAdPurchaseItemsByLogin`, { headers });
      return response.data;
    }),

  // ===== AdPurchaseTransaction API =====
  createAdPurchase: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${AD_PURCHASE_TRANSACTION_URL}/createAdPurchase`,
        data,
        { headers }
      );
      return response.data;
    }),

  getAdPurchaseTransactions: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${AD_PURCHASE_TRANSACTION_URL}/GetListAdPurchaseTransaction?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  getAllAdPurchaseTransactions: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${AD_PURCHASE_TRANSACTION_URL}/GetListAdPurchaseTransaction?page=1&pageSize=1000`,
        { headers }
      );
      return response.data;
    }),

  // ===== AdPurchaseSlot API =====
  // Removed all AdPurchaseSlot related methods as they are no longer used

  // This method calls a different endpoint than getAdPurchaseTransactions
  getUserAdPurchaseTransactions: (page = 1, pageSize = 5) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${AD_PURCHASE_TRANSACTION_URL}/AdPurchaseTransactionByUser`,
        {
          params: { page, pageSize },
          headers
        }
      );
      return response.data;
    }),

  // This method calls a different endpoint than getAllAdPurchaseTransactions
  getAllUserAdPurchaseTransactions: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${AD_PURCHASE_TRANSACTION_URL}/AdPurchaseTransactionByUser`,
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
        `${AD_PURCHASE_TRANSACTION_URL}/${id}`,
        { headers }
      );
      return response.data;
    })
};

export default adPurchaseService;
