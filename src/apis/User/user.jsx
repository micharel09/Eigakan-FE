import axios from "axios";
const API_URL = "https://eigakan1111-001-site1.qtempurl.com/api/User";

const UserApi = {
  async getUsers(page = 1, pageSize = 0) {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/GetAllUser`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: page,
          pageSize: pageSize,
        },
      });
      return res;
    } catch (err) {
      return err.response;
    }
  },

  async updateActive(data) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/ActiveDeactive_User`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      console.error("API error:", error.message);
      return error.response;
    }
  },

  async GetUserProfile() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/GetUserByLogin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (err) {
      return err.response;
    }
  },

  async CreateUser(data) {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/CreateUser`, data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(response);
        return response;
        
      } catch (error) {
        console.error("API error:", error.message);
        return error.response;
      }
},

};

export default UserApi;
