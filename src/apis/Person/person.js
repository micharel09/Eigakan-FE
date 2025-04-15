import axios from "axios";
import { makeAuthenticatedRequest, makePublicRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.PERSON;
const UPLOAD_URL = API_URLS.UPLOAD;

const personService = {
  getAllPerson: (pageNumber = 1, pageSize = 10, name = '') => 
    makeAuthenticatedRequest(async (headers) => {
      const params = { pageNumber, pageSize };
      if (name?.trim()) params.name = name.trim();
      
      const response = await axios.get(API_URL, {
        headers,
        params
      });
      
      const maxItems = pageSize * 6;
      return {
        ...response.data,
        total: Math.min(response.data.totalItems || maxItems, maxItems),
        hasNextPage: response.data.hasNextPage || 
          (response.data.data?.length >= pageSize)
      };
    }),

  getPersonById: (id) => 
    makeAuthenticatedRequest(async (headers) => {
      const response = await axios.get(`${API_URL}/${id}`, { headers });
      return response.data;
    }),

  createPerson: (personData) => 
    makeAuthenticatedRequest(async (headers) => {
      if (localStorage.getItem("role") !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can create persons");
      }
      
      const response = await axios.post(API_URL, personData, {
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    }),

  updatePerson: (id, personData) => 
    makeAuthenticatedRequest(async (headers) => {
      if (localStorage.getItem("role") !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can update persons");
      }
      
      const response = await axios.put(`${API_URL}/${id}`, personData, {
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      });
      return response.data;
    }),

  deletePerson: (id) => 
    makeAuthenticatedRequest(async (headers) => {
      if (localStorage.getItem("role") !== "ADMIN") {
        throw new Error("Unauthorized - Only admin can delete persons");
      }

      try {
        await axios.delete(`${API_URL}/${id}`, { headers });
        return { success: true, message: "Person deleted successfully" };
      } catch (error) {
        if (error.response?.status === 400) {
          return { success: true, message: "Person deleted successfully" };
        }
        throw error;
      }
    }),

  uploadImage: (file, abortSignal) => 
    makeAuthenticatedRequest(async (headers) => {
      const formData = new FormData();
      formData.append('formFiles', file.originFileObj || file);

      const uploadHeaders = {
        ...headers,
        'Content-Type': 'multipart/form-data',
        'accept': '*/*'
      };

      try {
        const response = await axios.post(UPLOAD_URL, formData, {
          headers: uploadHeaders,
          signal: abortSignal
        });
        return response;
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log('Upload cancelled');
          return;
        }
        throw err;
      }
    }),

  getTotalPersons: () => 
    makeAuthenticatedRequest(async (headers) => {
      try {
        const response = await axios.get(`${API_URL}/count`, { headers });
        
        let total = 30;
        if (response.data) {
          if (typeof response.data === 'object') {
            total = response.data.total || response.data.count || response.data.data || 30;
          } else if (typeof response.data === 'number') {
            total = response.data;
          }
        }
        
        return { success: true, total: Math.min(total, 30) };
      } catch (error) {
        try {
          const response = await axios.get(API_URL, {
            headers,
            params: { pageNumber: 1, pageSize: 1000 }
          });
          
          return { 
            success: true, 
            total: Math.min(response.data.data?.length || 30, 30)
          };
        } catch (innerError) {
          return { success: false, total: 30 };
        }
      }
    })
};

export default personService; 