import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.CONTRACT;

const contractApi = {
  getAllContract: (page, pageSize) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}`, {
        headers,
        params: {
          page,
          pageSize
        }
      });
      return response.data;
    }),

  createContract: (contractData) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(`${API_URL}/Generate_Contract`, contractData, { headers });
      return response.data;
    }),

  getAllContractByLogin: (page, pageSize) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetAllContractUserByLogin`, {
        headers,
        params: {
          page,
          pageSize
        }
      });
      return {
        contracts: response.data?.contracts || [],
        total: response.data?.total || 0
      };
    }),

  getAllContractByUserId: (userId, page, pageSize) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.get(`${API_URL}/GetAllContractByUserId`, {
          headers,
          params: {
            userId,
            page,
            pageSize
          }
        });
        return response.data;
      } catch (error) {
        console.error("Error fetching contracts by userId:", error);
        return { success: false, data: { contracts: [], total: 0 } };
      }
    }),

  getContractById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/${id}`, { headers });
      return response.data;
    }),

  acceptedContract: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.patch(`${API_URL}/Accepted_Contract`, data, { headers });
        if (response.data.success) {
          return response.data;
        } else {
          throw new Error(response.data.message || "Something went wrong");
        }
      } catch (error) {
        console.error("API error:", error.response?.data?.message || error.message);
        return error.response?.data || { success: false, message: "Request failed" };
      }
    }),

  deniedContract: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.patch(`${API_URL}/Denied_Contract`, data, { headers });
        return response;
      } catch (error) {
        console.error("API error:", error.message);
        return error.response;
      }
    }),

  updateContract: (id, contractData) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.put(`${API_URL}/${id}`, contractData, {
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
        });
        return response.data;
      } catch (error) {
        console.error("Error updating contract:", error);
        throw error.response?.data || {
          success: false,
          message: "Failed to update contract"
        };
      }
    })
};

export default contractApi;