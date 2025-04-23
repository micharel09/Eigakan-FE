import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AD_PURCHASE_ITEM;

const adPurchaseService = {
  getAdPurchaseItemsByLogin: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetAdPurchaseItemsByLogin`, { headers });
      return response.data;
    }),
};

export default adPurchaseService;
