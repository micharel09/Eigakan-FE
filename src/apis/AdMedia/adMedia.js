import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";
import axios from "axios";

const adMediaService = {
  createAdMedia: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${API_URLS.AD_MEDIA}`, data, { headers });
      return response.data;
    }),

  getAdMediaById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_MEDIA}/GetById/${id}`, { headers });
      return response.data;
    }),

  getActiveAdMedia: async () => {
    try {
      const response = await axios.get(`${API_URLS.AD_MEDIA}/GetAllAdMediaActive`);
      return response.data;
    } catch (error) {
      console.error("Error fetching active ad media:", error);
      return { success: false, data: [], message: error.message };
    }
  },

  getAllAdMedia: (page = 1, pageSize = 1000) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URLS.AD_MEDIA}/GetAllAdMedia`, {
        headers,
        params: { page, pageSize }
      });
      return response.data;
    }),

  approveAdMedia: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.patch(`${API_URLS.AD_MEDIA}/AdMedia_ApprovedStatus`, data, { headers });
      return response.data;
    }),

  rejectAdMedia: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.patch(`${API_URLS.AD_MEDIA}/AdMedia_RejectedStatus`, data, { headers });
      return response.data;
    }),

  updateAdMedia: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${API_URLS.AD_MEDIA}/UpdateAdMedia/${id}`, data, { headers });
      return response.data;
    })
};

export default adMediaService; 