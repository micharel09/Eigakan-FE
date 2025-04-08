import axios from "axios";
import { API_URLS, makeAuthenticatedRequest } from "../../utils/api";

const viewPaymentPolicyService = {
  getAllViewPaymentPolicies: (page = 1, pageSize = 5) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.VIEW_PAYMENT_POLICY}/GetAllViewPaymentPolicy?page=${page}&pageSize=${pageSize}`,
        { headers }
      );
      return response.data;
    }),

  getViewPaymentPolicyById: (id) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.VIEW_PAYMENT_POLICY}/GetViewPaymentPolicyById/${id}`,
        { headers }
      );
      return response.data;
    }),

  getViewPaymentPolicyActive: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.VIEW_PAYMENT_POLICY}/GetViewPaymentPolicyActive`,
        { headers }
      );
      return response.data;
    }),

  getListPolicyPendingAndWaiting: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(
        `${API_URLS.VIEW_PAYMENT_POLICY}/GetListPolicyPendingAndWaiting`,
        { headers }
      );
      return response.data;
    }),

  updateViewPaymentPolicy: (id, data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(
        `${API_URLS.VIEW_PAYMENT_POLICY}/UpdateViewPaymentPolicy/${id}`,
        data,
        { headers }
      );
      return response.data;
    }),

  cancelPolicy: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${API_URLS.VIEW_PAYMENT_POLICY}/CancelPolicy`,
        data,
        { headers }
      );
      return response.data;
    }),

  createViewPaymentPolicy: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.post(
        `${API_URLS.VIEW_PAYMENT_POLICY}/CreateViewPaymentPolicy`,
        data,
        { headers }
      );
      return response.data;
    }),
};

export default viewPaymentPolicyService; 