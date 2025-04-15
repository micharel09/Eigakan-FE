import axios from "axios";
import { API_URLS, makeAuthenticatedRequest } from "../../utils/api";

const API_URL = API_URLS.VIEW_PAYMENT_POLICY;

const viewPaymentPolicyService = {
  getAllViewPaymentPolicies: (page = 1, pageSize = 5) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetAllViewPaymentPolicy?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  getViewPaymentPolicyById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetViewPaymentPolicyById/${id}`,
        { headers }
      );
      return response.data;
    }),

  getViewPaymentPolicyActive: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetViewPaymentPolicyActive`,
        { headers }
      );
      return response.data;
    }),

  getListPolicyPendingAndWaiting: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URL}/GetListPolicyPendingAndWaiting`,
        { headers }
      );
      return response.data;
    }),

  updateViewPaymentPolicy: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(
        `${API_URL}/UpdateViewPaymentPolicy/${id}`,
        data,
        { headers }
      );
      return response.data;
    }),

  cancelPolicy: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${API_URL}/CancelPolicy`,
        data,
        { headers }
      );
      return response.data;
    }),

  createViewPaymentPolicy: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${API_URL}/CreateViewPaymentPolicy`,
        data,
        { headers }
      );
      return response.data;
    }),
};

export default viewPaymentPolicyService; 