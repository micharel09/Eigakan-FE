import axios from "axios";
import { API_URLS, makeAuthenticatedRequest } from "../../utils/api";

const API_URL = API_URLS.AD_PURCHASE_TRANSACTION;

const adPurchaseTransactionService = {
  getAdPurchaseTransactions: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetListAdPurchaseTransaction?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),
    
  getAllAdPurchaseTransactions: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetListAdPurchaseTransaction?page=1&pageSize=1000`,
        { headers }
      );
      return response.data;
    }),
};

export default adPurchaseTransactionService; 