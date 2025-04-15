import axios from "axios";
import { API_URLS, makeAuthenticatedRequest } from "../../utils/api";

const API_URL = API_URLS.USER_EARNING;

const userEarningService = {
  getUserEarnings: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/userEarning`,
        { 
          headers,
          params: {
            page,
            pageSize
          }
        }
      );
      return response.data;
    }),

  getUserEarningByLogin: (year = 0, month = 0, day = 0, dayOfWeek = 0) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetUserEarningByLogin`,
        { 
          headers,
          params: {
            year,
            month,
            day,
            dayOfWeek
          }
        }
      );
      return response.data;
    }),
};

export default userEarningService; 