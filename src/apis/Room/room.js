import axios from "axios";

const API_URL = "https://localhost:7192/api";

const roomService = {
  createRoom: async (roomData) => {
    try {
      console.log("Creating room with data:", roomData);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/Room/create`,
        {
          hostId: roomData.hostId,
          movieID: roomData.movieID,
          fileUrl: roomData.fileUrl,
          createDate: new Date().toISOString(),
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          isActive: true,
          status: "Active",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Room creation error:", error);
      throw error.response?.data || error;
    }
  },

  joinRoom: async (joinData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/Room/join-room`,
        {
          roomId: joinData.roomId,
          userId: joinData.userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
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
};

export default roomService;
