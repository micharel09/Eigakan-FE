import axios from "axios";

const movieBaseUrl="https://api.themoviedb.org/3"
const api_key='c6139f0bab8230733e79b230a484860b'

const movieByGenreBaseURL='https://api.themoviedb.org/3/discover/movie?api_key=c6139f0bab8230733e79b230a484860b';


// https://api.themoviedb.org/3/movie/550?api_key=c6139f0bab8230733e79b230a484860b
const getTrendingVideos=axios.get(movieBaseUrl+
    "/trending/all/day?api_key="+api_key);
    const getMovieByGenreId=(id)=>
        axios.get(movieByGenreBaseURL+"&with_genres="+id)


    export default{
        getTrendingVideos,
        getMovieByGenreId
    }