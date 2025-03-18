import axios from "axios";

const BASE_URL = "https://eigakan2222-001-site1.jtempurl.com/api";

const adSlotService = {
  // AdSlot APIs
  getAllAdSlots: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/AdSlot`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createAdSlot: async (data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${BASE_URL}/AdSlot`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateAdSlot: async (id, data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${BASE_URL}/AdSlot/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteAdSlot: async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${BASE_URL}/AdSlot/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // AdSlotTime APIs
  getAllAdSlotTimes: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/AdSlotTime`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createAdSlotTime: async (data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${BASE_URL}/AdSlotTime`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateAdSlotTime: async (id, data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${BASE_URL}/AdSlotTime/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteAdSlotTime: async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${BASE_URL}/AdSlotTime/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // AdSlotTimeRange APIs
  getAllAdSlotTimeRanges: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/AdSlotTimeRange`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createAdSlotTimeRange: async (data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${BASE_URL}/AdSlotTimeRange`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateAdSlotTimeRange: async (id, data) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${BASE_URL}/AdSlotTimeRange/${id}`,
        data,
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

  deleteAdSlotTimeRange: async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${BASE_URL}/AdSlotTimeRange/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adSlotService; 