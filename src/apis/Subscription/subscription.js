import axios from "axios";
import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.SUBSCRIPTION_PACKAGE;
const PAYMENT_API_URL = API_URLS.SUBSCRIPTION_PURCHASE_PAYMENT;

const subscriptionService = {
  getAllPackages: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  getPackageById: (id) =>
    makePublicRequest(async () => {
      return axios.get(`${API_URL}/${id}`);
    }, true),

  createPackage: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.post(`${API_URL}/`, data, { headers });
        // Nếu status là 201 thì cũng coi như thành công
        return {
          success: response.status === 201 || response.status === 200,
          data: response.data,
          message: "Package created successfully"
        };
      } catch (error) {
        throw error.response?.data;
      }
    }),

  updatePackage: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${API_URL}/${id}`, data, { headers });
      return response.data;
    }),

  deletePackage: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.delete(`${API_URL}/${id}`, { headers });
      return response.data;
    }),

  patchStatus: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.patch(`${API_URL}/${id}`, null, { headers });
        return response.data;
      } catch (error) {
        throw error.response?.data;
      }
    }),

  createPayment: (subscriptionId) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const returnUrl = `${window.location.origin}/payment-success`;
        const response = await axios.post(
          `${PAYMENT_API_URL}/create?subscriptionId=${subscriptionId}&returnUrl=${encodeURIComponent(returnUrl)}`,
          null,
          {
            headers: {
              ...headers,
              'Content-Type': 'application/json'
            }
          }
        );
        return {
          success: response.data.success,
          paymentUrl: response.data.paymentUrl,
          message: response.data.message
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || "Payment creation failed",
          error: error.response?.data
        };
      }
    }),

  getAllPurchaseHistory: (page = 1, pageSize = 10) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${PAYMENT_API_URL}/GetAllSubscriptionPurchaseUser?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  verifyPayment: (queryString) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${PAYMENT_API_URL}/vnpay-return?${queryString}`,
        { headers }
      );
      return response.data;
    }),
};

export default subscriptionService; 