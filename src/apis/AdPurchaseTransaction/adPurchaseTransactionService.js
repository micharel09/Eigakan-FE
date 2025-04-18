import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AD_PURCHASE_TRANSACTION;

const adPurchaseTransactionService = {
  createAdPurchase: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${API_URL}/createAdPurchase`,
        data,
        { headers }
      );
      return response.data;
    }),
};

export default adPurchaseTransactionService; 