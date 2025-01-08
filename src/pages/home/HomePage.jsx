import AuthScreen from "./AuthScreen";
import HomeScreen from "./HomeScreen";
import React from "react";

const HomePage = () => {
  const user = false;
  return <div>{user ? <HomeScreen /> : <AuthScreen />}</div>;
};

export default HomePage;
