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

  getAdPackageById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetAdPackageById/${id}`,
        { headers }
      );
      return response.data;
    }),

  createAdPackage: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${API_URL}/CreateAdPackage`,
        data,
        { headers }
      );
      return response.data;
    }),

  updateAdPackage: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(
        `${API_URL}/UpdateAdPackage/${id}`,
        data,
        { headers }
      );
      return response.data;
    }),

  deleteAdPackage: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(
        `${API_URL}/DeleteAdPackage/${id}`,
        { headers }
      );
      return response.data;
    }),
};

export default adPackageService; 