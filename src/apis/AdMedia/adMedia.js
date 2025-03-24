import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";
import axios from "axios";

const createAdMedia = async (data) => {
  return makeAuthenticatedRequest(async (headers) => {
    const response = await axios.post(`${API_URLS.AD_MEDIA}`, data, { headers });
    return response.data;
  });
};

const getAdMediaById = async (id) => {
  return makeAuthenticatedRequest(async (headers) => {
    const response = await axios.get(`${API_URLS.AD_MEDIA}/GetById/${id}`, { headers });
    return response.data;
  });
};

const getActiveAdMedia = async () => {
  try {
    const response = await axios.get(`${API_URLS.AD_MEDIA}/GetAllAdMediaActive`);
    return response.data;
  } catch (error) {
    console.error("Error fetching active ad media:", error);
    return { success: false, data: [], message: error.message };
  }
};

const getAllAdMedia = async (page = 1, pageSize = 10) => {
  return makeAuthenticatedRequest(async (headers) => {
    const response = await axios.get(`${API_URLS.AD_MEDIA}/GetAllAdMedia`, {
      headers,
      params: { page, pageSize }
    });
    return response.data;
  });
};

const approveAdMedia = async (data) => {
  return makeAuthenticatedRequest(async (headers) => {
    const response = await axios.patch(`${API_URLS.AD_MEDIA}/AdMedia_ApprovedStatus`, data, { headers });
    return response.data;
  });
};

const rejectAdMedia = async (data) => {
  return makeAuthenticatedRequest(async (headers) => {
    const response = await axios.patch(`${API_URLS.AD_MEDIA}/AdMedia_RejectedStatus`, data, { headers });
    return response.data;
  });
};

const updateAdMedia = async (id, data) => {
  return makeAuthenticatedRequest(async (headers) => {
    const response = await axios.put(`${API_URLS.AD_MEDIA}/UpdateAdMedia/${id}`, data, { headers });
    return response.data;
  });
};

export default {
  createAdMedia,
  getAdMediaById,
  getActiveAdMedia,
  getAllAdMedia,
  approveAdMedia,
  rejectAdMedia,
  updateAdMedia
}; 