import React from "react";
import { Link } from "react-router-dom";

const PeoplePage = () => {
  const people = [
    // Add your people data here
  ];

  const handleLoadMore = () => {
    // Implement the logic to load more people
  };

  return (
    <div className="container mx-auto p-4">
      {people.map((person) => (
        <div
          key={person.id}
          className="group p-4 rounded-lg hover:bg-[#FF009F]/5 transition-colors"
        >
          <Link
            to={`/person/${person.id}`}
            className="text-lg font-semibold text-white hover:text-[#FF009F] transition-colors"
          >
            {person.name}
          </Link>
          <span className="text-gray-400">{person.occupation}</span>
        </div>
      ))}
      <button
        onClick={handleLoadMore}
        className="px-8 py-3 bg-[#FF009F] hover:bg-[#D1007F] text-white 
        rounded-full transition-all duration-300"
      >
        Load More
      </button>
    </div>
  );
};

export default PeoplePage;
