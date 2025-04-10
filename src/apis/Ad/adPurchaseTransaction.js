import axios from "axios";
import { API_URLS, makeAuthenticatedRequest } from "../../utils/api";

const adPurchaseTransactionService = {
  getAdPurchaseTransactions: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.AD_PURCHASE_TRANSACTION}/GetListAdPurchaseTransaction?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),
    
  getAllAdPurchaseTransactions: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.AD_PURCHASE_TRANSACTION}/GetListAdPurchaseTransaction?page=1&pageSize=1000`,
        { headers }
      );
      return response.data;
    }),
};

export default adPurchaseTransactionService; 