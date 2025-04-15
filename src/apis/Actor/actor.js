import axios from "axios";
import { makePublicRequest, API_URLS } from "../../utils/api";

const API_URL = API_URLS.PERSON;

const actorService = {
  getActors: (pageNumber = 1, pageSize = 10) =>
    makePublicRequest(async () => {
      return axios.get(
        `${API_URL}`,
        {
          params: {
            pageNumber,
            pageSize
          }
        }
      );
    }),

  getActorById: (id) =>
    makePublicRequest(async () => {
      return axios.get(`${API_URL}/${id}`);
    }),

  getActorMovies: (actorId, pageNumber = 1, pageSize = 10) =>
    makePublicRequest(async () => {
      return axios.get(
        `${API_URL}/${actorId}/movies`,
        {
          params: {
            pageNumber,
            pageSize
          }
        }
      );
    })
};

export default actorService; 