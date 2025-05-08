import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const AD_PURCHASE_ITEM_URL = API_URLS.AD_PURCHASE_ITEM;
const AD_PURCHASE_TRANSACTION_URL = API_URLS.AD_PURCHASE_TRANSACTION;

const adPurchaseService = {
  // ===== AdPurchaseItem API =====
  getAdPurchaseItemsByLogin: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${AD_PURCHASE_ITEM_URL}/GetAdPurchaseItemsByLogin`, {
        headers,
        params: { page, pageSize }
      });
      return response.data;
    }),

    getAllAdPurchaseItems: (page = 1, pageSize = 10) =>
      makeAuthenticatedRequest(async (headers) => {
        const response = await axios.get(`${AD_PURCHASE_ITEM_URL}/GetAllAdPurchaseItems?page=${page}&pageSize=${pageSize}`, { headers });
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
    }),

  getMyHistoryAdPurchaseTransaction: (page = 1, pageSize = 5) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${AD_PURCHASE_TRANSACTION_URL}/MyHistoryAdPurchaseTransaction`,
        {
          headers,
          params: { page, pageSize }
        }
      );
      return response.data;
    }),

  getAllMyHistoryAdPurchaseTransaction: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${AD_PURCHASE_TRANSACTION_URL}/MyHistoryAdPurchaseTransaction`,
        {
          headers,
          params: { page: 1, pageSize: 1000 }
        }
      );
      return response.data;
    }),

  // Admin API for all ad purchase transactions
  getAllAdPurchaseTransaction: (page = 1, pageSize = 5) =>
    makeAuthenticatedRequest(async (headers) => {
      const url = `${AD_PURCHASE_TRANSACTION_URL}/GetAllAdPurchaseTransaction?page=${page}&pageSize=${pageSize}`;
      const response = await axios.get(url, { headers });
      return response.data;
    }),

  getAllAdPurchaseTransactionTotal: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${AD_PURCHASE_TRANSACTION_URL}/GetAllAdPurchaseTransaction?page=1&pageSize=1000`,
        { headers }
      );
      return response.data;
    })
};

export default adPurchaseService;
