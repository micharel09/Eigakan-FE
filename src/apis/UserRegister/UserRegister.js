import axios from "axios"
import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.USER_REGISTER;

const UserRegisterApi = {
    getUserRegisters: (page = 1, pageSize = 0) =>
        makeAuthenticatedRequest(async (headers) => {
            try {
                const res = await axios.get(`${API_URL}/userRegister`, {
                    headers,
                    params: {
                        page,
                        pageSize
                    }
                });
                return res;
            } catch (err) {
                return err.response;
            }
        }),

    getUserRegisterDetail: (id) =>
        makeAuthenticatedRequest(async (headers) => {
            try {
                const res = await axios.get(`${API_URL}/userRegisterById/${id}`, { headers });
                return res.data;
            } catch (err) {
                return err.response;
            }
        }),

    getListUserRegisterByEmail: (email) =>
        makeAuthenticatedRequest(async (headers) => {
            try {
                const res = await axios.get(`${API_URL}/userRegisterByEmail/${email}`, { headers });
                return res.data;
            } catch (err) {
                return err.response;
            }
        }),

    getAllUserRegisterByUserId: (userId, page = 1, pageSize = 10) =>
        makeAuthenticatedRequest(async (headers) => {
            try {
                const res = await axios.get(`${API_URL}/GetAllUserRegisterByUserId`, {
                    headers,
                    params: {
                        userId,
                        page,
                        pageSize
                    }
                });
                return res.data;
            } catch (err) {
                console.error("Error fetching user registers by user ID:", err);
                throw err.response?.data || err.message;
            }
        }),

    acceptedUserRegister: (data) =>
        makeAuthenticatedRequest(async (headers) => {
            try {
                const response = await axios.patch(`${API_URL}/Accepted_UserRegister`, data, { headers });
                return response;
            } catch (error) {
                console.error("API error:", error.message);
                return error.response;
            }
        }),

    rejectedUserRegister: (newUser) =>
        makeAuthenticatedRequest(async (headers) => {
            try {
                const response = await axios.patch(`${API_URL}/Rejected_UserRegister`, newUser, { headers });
                return response;
            } catch (error) {
                console.error("API error:", error.message);
                return error.response;
            }
        }),

    CreateUserRegister: (email, phoneNumber, reason, fileUrl, fullName) =>
        makePublicRequest(async () => {
            try {
                const res = await axios.post(`${API_URL}/CreateUserRegister`, {
                    email,
                    phoneNumber,
                    reason,
                    fileUrl,
                    fullName,
                });
                return res;
            } catch (err) {
                if (err.response?.data?.errors) {
                    const firstError = Object.values(err.response.data.errors)[0];
                    throw {
                        message: Array.isArray(firstError) ? firstError[0] : firstError,
                    };
                }
                throw err.response?.data || { message: "Network error" };
            }
        }, true),
};

export default UserRegisterApi 