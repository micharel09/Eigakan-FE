import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/contracts";

const contractApi = {
 
    async getAllContract(pageNumber = 1, pageSize = 10) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_URL}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              pageNumber,
              pageSize
            }
          });
          return response.data;
        } catch (error) {
          throw error.response?.data || error.message;
        }
    },

    async createContract(contractData) {
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.post(`${API_URL}/generate`, contractData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
    },

    async getAllContractByLogin(pageNumber = 1, pageSize = 10) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_URL}/GetAllContractUserByLogin`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              pageNumber,
              pageSize
            }
          });
          return response.data;
        } catch (error) {
          throw error.response?.data || error.message;
        }
    },

    async getContractById(id) {
      try {
        const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  
    async acceptedContract(data) {
      try {
          const token = localStorage.getItem('token');
          const response = await axios.patch(`${API_URL}/Accepted_Contract`, data, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });
          return response;
        } catch (error) {
          console.error("API error:", error.message);
          return error.response;
        }
    },

    async deniedContract(data) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`${API_URL}/Denied_Contract`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response;
          } catch (error) {
            console.error("API error:", error.message);
            return error.response;
          }
    },


}

  export default contractApi;