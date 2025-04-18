import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AD_PACKAGE;

const adPackageService = {
  getAllAdPackages: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetAllAdPackageAsync?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  getAdPackageByQuantity: (quantity) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetAdPackageByQuantity/${quantity}`,
        { headers }
      );
      return response.data;
    }),
};

export default adPackageService; 