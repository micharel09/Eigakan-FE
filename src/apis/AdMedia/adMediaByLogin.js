import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.AD_MEDIA;

const adMediaByLoginService = {
  getAdMediaByLogin: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetAdMediaByLogin?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  getMediaStatusExpiredByLogin: (page = 1, pageSize = 1000) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetMediaStatusExpiredByLogin?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),
};

export default adMediaByLoginService;
