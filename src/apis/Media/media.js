import axios from "axios";
import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.MEDIA;

const mediaApi = {
  getMedia: () => 
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(API_URL, { headers });
      return response.data;
    }),

  getMediaById: (id) =>
    makePublicRequest(async () => {
      return axios.get(`${API_URL}/${id}`);
    }),

  createMedia: (mediaData) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(API_URL, mediaData, { headers });
      return response.data;
    }),

  updateMedia: (id, mediaData) =>
    makeAuthenticatedRequest(async (headers) => {
      const role = localStorage.getItem("role");
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete media");
      }

      const response = await axios.put(`${API_URL}/${id}`, mediaData, { headers });
      return response.data;
    }),

  deleteMedia: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const role = localStorage.getItem("role");
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete genres");
      }

      try {
        await axios.delete(`${API_URL}/${id}`, {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
        return { success: true };
      } catch (error) {
        // If status is 400 but actually succeeded
        if (error.response?.status === 400) {
          return { success: true };
        }
        // Other errors
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw error.response?.data || error.message;
      }
    })
};

export default mediaApi; 