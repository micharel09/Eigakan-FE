import axios from "axios"
import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api"

const API_URL = API_URLS.NEWS;
const UPLOAD_URL = API_URLS.UPLOAD_PICTURES;

const NewsApi = {
    getAllNews: () => makePublicRequest(async () => {
        const response = await axios.get(API_URL)
        return response
    }),

    getNewsById: (id) => makePublicRequest(async () => {
        const response = await axios.get(`${API_URL}/${id}`)
        return response
    }),

    uploadImage: (file) => makeAuthenticatedRequest(async (headers) => {
        const formData = new FormData()
        const actualFile = file.originFileObj || file
        formData.append('formFiles', actualFile)

        const uploadHeaders = {
            ...headers,
            'Content-Type': 'multipart/form-data',
            'accept': '*/*'
        }

        const response = await axios.post(UPLOAD_URL, formData, { headers: uploadHeaders })
        return response.data
    }),

    createNews: (data) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.post(API_URL, data, { headers })
            return response.data
        }),

    updateNews: (id, data) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.put(`${API_URL}/${id}`, data, { headers })
            return response.data
        }),

    setInactive: (id) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.patch(
                `${API_URL}/${id}/status`,
                {},
                { headers }
            )
            return response.data
        }),

    deleteNews: (id) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.delete(`${API_URL}/${id}`, { headers })
            return response.data
        }),

    getNewsByUserId: (userId) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.get(`${API_URL}/user/${userId}`, { headers })
            return response.data
        })
}

export default NewsApi 