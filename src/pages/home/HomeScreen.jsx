import React from "react";
import Navbar from "../../components/Header/Navbar";
import Slider from "../../components/Homepage/Slider";
import { Helmet } from "react-helmet";
import ProductionHouse from "../../components/Homepage/ProductionHouse";
import HrMovieCard from "../../components/Homepage/HrMovieCard";
import GenreMovieList from "../../components/Homepage/GenresMovieList";

const HomeScreen = () => {
  return (
    <div>
      <Helmet>
        <title>HomeScreen</title>
      </Helmet>
      {/* Navbar */}
      <Navbar />
      <Slider />
      <ProductionHouse />
      <HrMovieCard />
      <GenreMovieList />
    </div>
  );
};

export default HomeScreen;
