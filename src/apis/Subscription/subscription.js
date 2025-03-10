import axios from "axios";

const API_URL = "https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPackage";

const subscriptionService = {
  getAllPackages: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPackageById: (id) => {
    return axios.get(`${API_URL}/${id}`);
  },

  createPackage: async (data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Nếu status là 201 thì cũng coi như thành công
      return {
        success: response.status === 201 || response.status === 200,
        data: response.data,
        message: "Package created successfully"
      };
    } catch (error) {
      throw error.response?.data;
    }
  },

  updatePackage: async (id, data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_URL}/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deletePackage: async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  patchStatus: async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(`${API_URL}/${id}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data;
    }
  },

  createPayment: async (subscriptionId) => {
    try {
      const token = localStorage.getItem("token");
      const returnUrl = `${window.location.origin}/payment-success`;
      const response = await axios.post(
        `${API_URL.replace('/SubscriptionPackage', '')}/SubscriptionPurchasePayment/create?subscriptionId=${subscriptionId}&returnUrl=${encodeURIComponent(returnUrl)}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
  },

  getAllPurchaseHistory: async (page = 1, pageSize = 10) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://eigakan2222-001-site1.jtempurl.com/api/SubscriptionPurchasePayment/GetAllSubscriptionPurchaseUser?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default subscriptionService; 