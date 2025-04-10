import axios from "axios";

const API_URL = "https://eigakan2222-001-site1.jtempurl.com/api/MovieEarning";


const movieEarningService = {


    async getAllMovieEarning (page = 1, pageSize = 10){
        try{          
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/movieEarning`,{
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

    async getMovieEarningByLogin (page = 1, pageSize = 10, startDate = null, endDate = null) {
        try {          
            const token = localStorage.getItem('token');
    
            const res = await axios.get(`${API_URL}/GetMovieEarningByLogin`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    page,
                    pageSize,
                    ...(startDate && { startDate }),
                    ...(endDate && { endDate })
                }
            });
    
            return res.data;
    
        } catch (err) {
            return err.response?.data || { message: "Something went wrong!" };
        }
    },

    async getMovieEarningByMovieId(page = 1, pageSize = 10, movieId, startDate = null, endDate = null) {
        const token = localStorage.getItem('token');
      
        try {
          const res = await axios.get(`${API_URL}/GetMovieEarningByMovieId/${movieId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              page,
              pageSize,
              ...(startDate && { startDate }),
              ...(endDate && { endDate })
            }
          });
      
          // ✅ Trả trực tiếp res.data, không bọc .result nữa
          return res.data.data;
      
        } catch (err) {
          console.error("Fetch movie earning error:", err);
          throw err; // giữ nguyên throw để catch ở ngoài xử lý
        }
      }
      
      
    

};
export default movieEarningService;