import axios from "axios"

const API_URL = 'https://localhost:7192/api/News'
const UPLOAD_URL = 'https://eigakan1111-001-site1.qtempurl.com/api/Media/Upload_Pictures'

const NewsApi = {
    // Get all news with pagination
    async getNews(page = 1, pageSize = 10) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    pageNumber: page,
                    pageSize: pageSize
                }
            });
            return res;
        } catch (err) {
            console.error("API Error:", err);
            return err.response;
        }
    },

    // Get news by ID
    async getNewsById(id) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res;
        } catch (err) {
            console.error("Get News Error:", err);
            return err.response;
        }
    },

    // Upload image first
    async uploadImage(file) {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            const actualFile = file.originFileObj || file;
            formData.append('formFiles', actualFile);

            const res = await axios.post('https://eigakan1111-001-site1.qtempurl.com/api/Media/Upload_Pictures', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                    'accept': '*/*'
                }
            });
            return res;
        } catch (err) {
            return err.response;
        }
    },

    // Create new news
    async createNews(data) {
        try {
            const token = localStorage.getItem('token');
            const newsData = {
                title: data.title,
                content: data.content,
                picture: data.picture,
                url: data.url || '',
                status: "1",
                userId: localStorage.getItem('userId')
            };

            const res = await axios.post(API_URL, newsData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return res;
        } catch (err) {
            console.error("Create Error:", err);
            return err.response;
        }
    },

    // Update news
    async updateNews(id, data) {
        try {
            const token = localStorage.getItem('token');
            const newsData = {
                id: id,
                title: data.title,
                content: data.content,
                picture: data.picture,
                url: data.url || '',
                status: data.status || "1",
                userId: localStorage.getItem('userId')
            };

            const res = await axios.put(`${API_URL}/${id}`, newsData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return res;
        } catch (err) {
            console.error("Update Error:", err);
            return err.response;
        }
    },

    // Delete news (set to inactive)
    async setInactive(id) {
        try {
            const token = localStorage.getItem('token');
            console.log("Setting news inactive, ID:", id);
            
            // Sửa lại endpoint và body theo BE
            const res = await axios.patch(`${API_URL}/${id}/status`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log("Set inactive response:", res);
            return res;
        } catch (err) {
            console.error("Set inactive Error:", err);
            return err.response;
        }
    },

    // Delete news
    async deleteNews(id) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`${API_URL}/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res;
        } catch (err) {
            return err.response;
        }
    },
}

export default NewsApi; 