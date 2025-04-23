import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AD_PURCHASE_ITEM;

const adPurchaseItemService = {
  getAdPurchaseItemsByLogin: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetAdPurchaseItemsByLogin`, { headers });
      return response.data;
    }),

  getAdPurchaseItemsById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetAllAdPurchaseItemsById?id=${id}`, { headers });
      return response.data;
    }),
};

export default adPurchaseItemService;
