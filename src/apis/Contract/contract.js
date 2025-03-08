import axios from "axios";

const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/contracts";

const contractApi = {
 
    async getAllContract(page , pageSize ) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_URL}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              page,
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
      
      const response = await axios.post(`${API_URL}/Generate_Contract`, contractData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
    },

    async getAllContractByLogin(page, pageSize ) {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_URL}/GetAllContractUserByLogin`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              page,
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
        const token = localStorage.getItem("token");
        const response = await axios.patch(`${API_URL}/Accepted_Contract`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        // Kiểm tra success từ API trả về
        if (response.data.success) {
          return response.data; // Thành công
        } else {
          throw new Error(response.data.message || "Something went wrong");
        }
      } catch (error) {
        console.error("API error:", error.response?.data?.message || error.message);
        
        // Trả về lỗi từ API (nếu có) để xử lý phía frontend
        return error.response?.data || { success: false, message: "Request failed" };
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