import axios from "axios"
import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api"

/**
 * Service for handling news operations
 */
const NewsApi = {
    /**
     * Get all news - Public endpoint
     */
    getAllNews: () => makePublicRequest(async () => {
        const response = await axios.get(API_URLS.NEWS)
        return response
    }),

    /**
     * Get news by ID - Public endpoint
     */
    getNewsById: (id) => makePublicRequest(async () => {
        const response = await axios.get(`${API_URLS.NEWS}/${id}`)
        return response
    }),

    /**
     * Upload image for news - Authenticated endpoint
     */
    uploadImage: (file) => makeAuthenticatedRequest(async (headers) => {
        const formData = new FormData()
        const actualFile = file.originFileObj || file
        formData.append('formFiles', actualFile)

        const uploadHeaders = {
            ...headers,
            'Content-Type': 'multipart/form-data',
            'accept': '*/*'
        }

        const response = await axios.post(API_URLS.UPLOAD, formData, { headers: uploadHeaders })
        return response.data
    }),

    /**
     * Create new news
     * @param {Object} data News data
     * @returns {Promise<{success: boolean, data: Object, message: string}>} Created news details
     */
    createNews: (data) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.post(API_URLS.NEWS, data, { headers })
            return response.data
        }),

    /**
     * Update existing news
     * @param {string} id News ID
     * @param {Object} data Updated news data
     * @returns {Promise<{success: boolean, data: Object, message: string}>} Updated news details
     */
    updateNews: (id, data) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.put(`${API_URLS.NEWS}/${id}`, data, { headers })
            return response.data
        }),

    /**
     * Set news status to inactive
     * @param {string} id News ID
     * @returns {Promise<{success: boolean, data: Object, message: string}>} Operation result
     */
    setInactive: (id) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.patch(
                `${API_URLS.NEWS}/${id}/status`,
                {},
                { headers }
            )
            return response.data
        }),

    /**
     * Delete news
     * @param {string} id News ID
     * @returns {Promise<{success: boolean, data: Object, message: string}>} Operation result
     */
    deleteNews: (id) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.delete(`${API_URLS.NEWS}/${id}`, { headers })
            return response.data
        }),

    /**
     * Get news by user ID
     * @param {string} userId User ID
     * @returns {Promise<{success: boolean, data: Array, message: string}>} List of user's news
     */
    getNewsByUserId: (userId) =>
        makeAuthenticatedRequest(async (headers) => {
            const response = await axios.get(`${API_URLS.NEWS}/user/${userId}`, { headers })
            return response.data
        })
}

export default NewsApi 