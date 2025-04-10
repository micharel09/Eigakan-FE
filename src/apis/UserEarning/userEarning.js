import axios from "axios";
import { API_URLS, makeAuthenticatedRequest } from "../../utils/api";

const userEarningService = {
  getUserEarnings: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.BASE}/UserEarning/userEarning?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  getUserEarningByLogin: (year = 0, month = 0, day = 0, dayOfWeek = 0) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.BASE}/UserEarning/GetUserEarningByLogin?year=${year}&month=${month}&day=${day}&dayOfWeek=${dayOfWeek}`,
        { headers }
      );
      return response.data;
    }),
};

export default userEarningService; 