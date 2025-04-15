import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";
import axios from "axios";

const API_URL = API_URLS.AD_MEDIA_COUNT;

const adMediaCountService = {
  getAdMediaCountByAdMediaId: (adMediaId) =>
    makePublicRequest(async () => {
      const response = await axios.get(`${API_URL}/GetAdMediaCountByAdMediaId/${adMediaId}`);
      return response;
    }),

  increaseAdMediaCount: (data) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URL}/IncreaseAdMediaCount`, data);
      return response;
    }),
    
  getStatisticAdMediaCount: (adMediaId) =>
    makePublicRequest(async () => {
      const response = await axios.get(`${API_URL}/StatisticAdMediaCount/${adMediaId}`);
      return response;
    }),
};

export default adMediaCountService; 