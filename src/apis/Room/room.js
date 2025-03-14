import axios from "axios";

const API_URL = "https://localhost:7192/api";

const roomService = {
  getRoomDetails: async (roomId) => {
    try {
      const response = await axios.get(`${API_URL}/Room/${roomId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting room details:", error);
      throw error;
    }
  },

  createRoom: async (roomData) => {
    try {
      const response = await axios.post(`${API_URL}/Room/create`, roomData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error;
    }
  },

  joinRoom: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/Room/join`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error joining room:", error);
      throw error;
    }
  },

  getActiveRooms: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/Room/active`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getHostRoom: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/Room/get-host-room`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getRoomLink: async (roomId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/Room/share-link/${roomId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  endRoom: async (roomId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_URL}/Room/end/${roomId}`, null, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  leaveRoom: async (roomId) => {
    try {
      const response = await axios.post(
        `${API_URL}/Room/leave/${roomId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error leaving room:", error);
      throw error;
    }
  },
};

export default roomService;
