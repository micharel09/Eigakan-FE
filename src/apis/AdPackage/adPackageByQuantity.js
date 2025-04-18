import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AD_PACKAGE;

const adPackageByQuantityService = {
  getAdPackageByQuantity: (quantity) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetAdPackageByQuantity/${quantity}`,
        { headers }
      );
      return response.data;
    }),
};

export default adPackageByQuantityService;
