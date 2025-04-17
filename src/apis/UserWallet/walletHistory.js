import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.WALLET_TRANSACTION;

const walletHistoryService = {
  getWalletHistory: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/MyHistoryWallet`, 
        { 
          headers,
          params: { page, pageSize }
        }
      );
      return response.data;
    }),
};

export default walletHistoryService;
