import axios from "axios"

const API_URL = 'https://eigakan2222-001-site1.jtempurl.com/api/News'

const NewsApi = {
    // Get all news
    async getNews() {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res;
        } catch (err) {
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

            const res = await axios.post('https://eigakan2222-001-site1.jtempurl.com/api/Upload/Upload_Pictures', formData, {
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

    // Create news
    async createNews(data) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res;
        } catch (err) {
            return err.response;
        }
    },

    // Update news
    async updateNews(id, data) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/${id}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res;
        } catch (err) {
            return err.response;
        }
    },

    // Delete news (set to inactive)
    async setInactive(id) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_URL}/${id}/status`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res;
        } catch (err) {
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

    // Get news by user ID
    async getNewsByUserId(userId) {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/user/${userId}`, {
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