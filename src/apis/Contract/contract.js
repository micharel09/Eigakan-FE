import axios from "axios";

const API_URL = "https://eigakan2222-001-site1.jtempurl.com/api/contracts";

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

    async getAllContractByLogin(page = 1 , pageSize = 10) {
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
          // Log để kiểm tra response
          console.log("API Response:", response);
          // Trả về đúng cấu trúc data
          return {
            contracts: response.data?.contracts || [],
            total: response.data?.total || 0,
            totalSigned: response.data?.totalSigned || 0,
            totalEarning: response.data?.totalEarning || 0,
          };
        } catch (error) {
          throw error.response?.data || error.message;
        }
    },

    

    async getAllContractByUserId(userId, page, pageSize) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/GetAllContractByUserId`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            userId,
            page,
            pageSize
          }
        });
        
        console.log("Contracts by userId Response:", response);
        
        return response.data;
      } catch (error) {
        console.error("Error fetching contracts by userId:", error);
        return { success: false, data: { contracts: [], total: 0 } };
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

    async updateContract(id, contractData) {
      try {
        const token = localStorage.getItem("token");
  
        const response = await axios.put(`${API_URL}/${id}`, contractData, {
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


}

  export default contractApi;