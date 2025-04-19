import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.USER_WALLET;

const userWalletService = {
  getUserWalletByLogin: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetUserWalletByLogin`, { headers });
      return response.data;
    }),
};

export default userWalletService;
