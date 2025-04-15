import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";
import axios from "axios";

const API_URL = API_URLS.AD_MEDIA;

const adMediaService = {
  createAdMedia: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${API_URL}`, data, { headers });
      return response.data;
    }),

  getAdMediaById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetById/${id}`, { headers });
      return response.data;
    }),

  getActiveAdMedia: () =>
    makePublicRequest(async () => {
      return axios.get(`${API_URL}/GetAllAdMediaActive`);
    }),

  getAllAdMedia: (page = 1, pageSize = 1000) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetAllAdMedia`, {
        headers,
        params: { page, pageSize }
      });
      return response.data;
    }),

  approveAdMedia: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.patch(`${API_URL}/AdMedia_ApprovedStatus`, data, { headers });
      return response.data;
    }),

  rejectAdMedia: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.patch(`${API_URL}/AdMedia_RejectedStatus`, data, { headers });
      return response.data;
    }),

  updateAdMedia: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${API_URL}/UpdateAdMedia/${id}`, data, { headers });
      return response.data;
    })
};

export default adMediaService; 