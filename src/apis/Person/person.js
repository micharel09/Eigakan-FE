import axios from "axios";

const API_URL = "https://eigakan2222-001-site1.jtempurl.com/api/Person";

const personService = {
  // Get all persons with pagination and search
  async getAllPerson(pageNumber = 1, pageSize = 1000, name = '') {
    try {
      const token = localStorage.getItem("token");
      const params = { pageNumber, pageSize };
      if (name?.trim()) params.name = name.trim();
      
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      // Set paging limits
      const maxItems = pageSize * 6;
      return {
        ...response.data,
        total: Math.min(response.data.totalItems || maxItems, maxItems),
        hasNextPage: response.data.hasNextPage || 
          (response.data.data?.length >= pageSize)
      };
    } catch (error) {
      console.error("Error fetching persons:", error);
      throw error.response?.data || { 
        success: false, 
        message: "Could not load person list" 
      };
    }   
  },

  // Get person by ID
  async getPersonById(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: "Error fetching person" };
    }
  },

  // Create new person
  async createPerson(personData) {
    try {
      const token = localStorage.getItem("token");
      if (localStorage.getItem("role") !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create persons");
      }

      const response = await axios.post(API_URL, personData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
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

  // Update person
  async updatePerson(id, personData) {
    try {
      const token = localStorage.getItem("token");
      if (localStorage.getItem("role") !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can update persons");
      }

      const response = await axios.put(`${API_URL}/${id}`, personData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
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

  // Delete person
  async deletePerson(id) {
    try {
      const token = localStorage.getItem("token");
      if (localStorage.getItem("role") !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can delete persons");
      }

      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
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
  },

  // Upload image
  async uploadImage(file, abortSignal) {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('formFiles', file.originFileObj || file);

      const res = await axios.post(
        'https://eigakan2222-001-site1.jtempurl.com/api/Upload/Upload_Pictures', 
        formData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'accept': '*/*'
          },
          signal: abortSignal
        }
      );
      return res;
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Upload cancelled');
        return;
      }
      return err.response;
    }
  },

  // Get total count of persons
  async getTotalPersons() {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let total = 30;
      if (response.data) {
        if (typeof response.data === 'object') {
          total = response.data.total || response.data.count || response.data.data || 30;
        } else if (typeof response.data === 'number') {
          total = response.data;
        }
      }
      
      return { success: true, total: Math.min(total, 30) };
    } catch (error) {
      console.error("Error fetching total persons:", error);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
          params: { pageNumber: 1, pageSize: 1000 }
        });
        
        return { 
          success: true, 
          total: Math.min(response.data.data?.length || 30, 30)
        };
      } catch (innerError) {
        return { success: false, total: 30 };
      }
    }
  }
};

export default personService; 