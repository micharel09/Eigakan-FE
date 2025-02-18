import axios from "axios"

const API_URL = 'https://eigakan1111-001-site1.qtempurl.com/api/UserRegister'

const UserRegisterApi = {

    async getUserRegisters (page = 1, pageSize = 0){
        try{          
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/userRegister`,{
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params:{
                    page: page,
                    pageSize: pageSize
                }
            });
            return res;
            
        }catch (err){
            return err.response;
        }
    },

    async getUserRegisterDetail(id) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/userRegisterById/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res.data;
        } catch (err) {
            return err.response;
        }
    },

    async getListUserRegisterByEmail(email) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/userRegisterByEmail/${email}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res.data;
        } catch (err) {
            return err.response;
        }
    },

    async acceptedUserRegister(data) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`${API_URL}/Accepted_UserRegister`, data, {
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

    async rejectedUserRegister(data) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(`${API_URL}/Rejected_UserRegister`, data, {
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

    async CreateUserRegister(email, phoneNumber, reason, fileUrl, fullName) {
    try {
      const res = await axios.post(`${API_URL}/CreateUserRegister`, {
        email,
        phoneNumber,
        reason,
        fileUrl,
        fullName,
      });
      return res.data;
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        throw {
          message: Array.isArray(firstError) ? firstError[0] : firstError,
        };
      }
      throw err.response?.data || { message: "Network error" };
    }
  },

}
export default UserRegisterApi 