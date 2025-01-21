import axios from "axios"

const API_URL = 'https://eigakan1111-001-site1.qtempurl.com/api/User'

const UserApi = {

    async getUsers (page = 1, pageSize = 0){
        try{
            const res = await axios.get(`${API_URL}/users`,{
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

    async updateActive (data) {
        try {
            const response = await axios.patch(`${API_URL}/ActiveDeactive_User`, data);
            return response;
          } catch (error) {
            console.error("API error:", error.message);
            return error.response;
          }
        }
}


export default UserApi