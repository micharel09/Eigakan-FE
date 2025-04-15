import axios from "axios";
import { makeAuthenticatedRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.ROOM;

const roomService = {
  getRoomDetails: (roomId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/GetById/${roomId}`, { headers });
      return response.data;
    }),

  createRoom: (roomData) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.post(`${API_URL}/create`, roomData, { headers });
        return response.data;
      } catch (error) {
        console.error("Error creating room:", error);
        if (error.response && error.response.data) {
          throw error.response.data;
        }
        throw error;
      }
    }),

  joinRoom: (data) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.post(`${API_URL}/join`, data, { headers });
        return response.data;
      } catch (error) {
        console.error("Error joining room:", error);
        if (error.response && error.response.data) {
          throw error.response.data;
        }
        throw error;
      }
    }),

  getActiveRooms: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/active`, {
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    }),

  getHostRoom: () =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/get-host-room`, {
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    }),

  getRoomLink: (roomId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/share-link/${roomId}`, {
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    }),

  endRoom: (roomId) =>
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.put(`${API_URL}/end/${roomId}`, null, {
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    }),

  leaveRoom: (roomId) =>
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.post(`${API_URL}/leave/${roomId}`, {}, { headers });
        return response.data;
      } catch (error) {
        console.error("Error leaving room:", error);
        throw error;
      }
    }),
};

export default roomService;
