import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.USER;

const UserApi = {
  getUsers: (page = 1, pageSize = 0) =>
    makeAuthenticatedRequest(async (headers) => {
      const res = await axios.get(`${API_URL}/GetAllUser`, {
        headers,
        params: {
          page,
          pageSize,
        },
      });
      return res;
    }),

  updateActive: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.patch(
          `${API_URL}/ActiveDeactive_User`,
          data,
          { headers }
        );
        return response;
      } catch (error) {
        console.error("API error:", error.message);
        return error.response;
      }
    }),

  GetUserProfile: () =>
    makeAuthenticatedRequest(async (headers) => {
      const res = await axios.get(`${API_URL}/GetUserByLogin`, { headers });
      return res.data;
    }),

  CreateUser: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.post(`${API_URL}/CreateUser`, data, {
          headers,
        });
        console.log(response);
        return response;
      } catch (error) {
        console.error("API error:", error.message);
        return error.response;
      }
    }),

  CreateUserByRegister: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.post(
          `${API_URL}/CreateUserByRegister`,
          data,
          { headers }
        );
        console.log(response);
        return response;
      } catch (error) {
        console.error("API error:", error.message);
        return error.response;
      }
    }),

  getUserDetail: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const res = await axios.get(`${API_URL}/GetUserById/${id}`, { headers });
      return res.data;
    }),

  updateUser: (id, userData) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.put(
          `${API_URL}/UpdateUser/${id}`,
          userData,
          {
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error("Error updating User:", error);
        throw (
          error.response?.data || {
            success: false,
            message: "Failed to update User",
          }
        );
      }
    }),
};

export default UserApi;
