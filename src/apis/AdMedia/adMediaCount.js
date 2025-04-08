import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";
import axios from "axios";

const adMediaCountService = {
  getAdMediaCountByAdMediaId: (adMediaId) =>
    makePublicRequest(async () => {
      const response = await axios.get(`${API_URLS.AD_MEDIA_COUNT}/GetAdMediaCountByAdMediaId/${adMediaId}`);
      return response;
    }),

  increaseAdMediaCount: (data) =>
    makePublicRequest(async () => {
      const response = await axios.post(`${API_URLS.AD_MEDIA_COUNT}/IncreaseAdMediaCount`, data);
      return response;
    }),
    
  getStatisticAdMediaCount: (adMediaId) =>
    makePublicRequest(async () => {
      const response = await axios.get(`${API_URLS.AD_MEDIA_COUNT}/StatisticAdMediaCount/${adMediaId}`);
      return response;
    }),
};

export default adMediaCountService; 