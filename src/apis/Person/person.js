import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/Person";

const personService = {
  async getAllPerson() {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching persons:", error);
      throw error.response?.data || { 
        success: false,
        message: "Failed to fetch persons" 
      };
    }   
  },

  async getPersonById(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "Error fetching person" };
    }
  },

  async createPerson(personData) {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      
      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete persons");
      }

      const response = await axios.post(API_URL, personData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating person:", error);
      throw error.response?.data || {
        success: false,
        message: "Failed to create person"
      };
    }
  },

  async updatePerson(id, personData) {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete persons");
      }

      const response = await axios.put(`${API_URL}/${id}`, personData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating person:", error);
      throw error.response?.data || {
        success: false,
        message: "Failed to update person"
      };
    }
  },

  async deletePerson(id) {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (role !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create/update/delete persons");
      }

      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { success: true, message: "Person deleted successfully" };
    } catch (error) {
      console.error("Error deleting person:", error);
      if (error.response?.status === 400) {
        return { success: true, message: "Person deleted successfully" };
      }
      throw error.response?.data || {
        success: false,
        message: "Failed to delete person"
      };
    }
  }
};

export default personService; 