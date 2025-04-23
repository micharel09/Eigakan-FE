import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.ADMIN_DASHBOARD;

const adminDashboardService = {
    getDashboardAdminOverall: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetDashboardAdminOverall`, { headers });
      return response.data;
    }),
};

export default adminDashboardService;
