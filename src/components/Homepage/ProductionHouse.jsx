import React from "react";
import { motion } from "framer-motion";

const ProductionHouse = () => {
  const productionHouses = [
    {
      id: 1,
      image: "/ProductionHouse/Images/disney.png",
      video: "/ProductionHouse/Videos/disney.mp4",
    },
    {
      id: 2,
      image: "/ProductionHouse/Images/pixar.png",
      video: "/ProductionHouse/Videos/pixar.mp4",
    },
    {
      id: 3,
      image: "/ProductionHouse/Images/marvel.png",
      video: "/ProductionHouse/Videos/marvel.mp4",
    },
    {
      id: 4,
      image: "/ProductionHouse/Images/starwar.png",
      video: "/ProductionHouse/Videos/star-wars.mp4",
    },
    {
      id: 5,
      image: "/ProductionHouse/Images/nationalG.png",
      video: "/ProductionHouse/Videos/national-geographic.mp4",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 px-4">
      {productionHouses.map((production) => (
        <motion.div
          key={production.id}
          whileHover={{ scale: 1.05 }}
          className="relative rounded-lg overflow-hidden border border-gray-800 
            group cursor-pointer bg-gradient-to-b from-gray-900 to-black"
        >
          <video
            src={production.video}
            autoPlay
            loop
            playsInline
            muted
            className="absolute inset-0 opacity-0 group-hover:opacity-100 
              transition-opacity duration-500 object-cover w-full h-full"
          />
          <img
            src={production.image}
            alt=""
            className="w-full object-cover transition-transform duration-500 
              group-hover:scale-110 relative z-10 group-hover:opacity-0"
          />
        </motion.div>
      ))}
    </div>
  );
};

export default ProductionHouse;
