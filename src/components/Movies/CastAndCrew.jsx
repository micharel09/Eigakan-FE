import React from "react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import GlobalApi from "../Homepage/GlobalApi";

const CastAndCrew = ({ persons }) => {
  if (!persons?.length) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-white">Cast & Crew</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {persons.map((person) => (
          <Link
            to={`/person/${person.id}`}
            key={person.id}
            className="group bg-gray-800/50 rounded-lg overflow-hidden transition-transform hover:scale-105"
          >
            <img
              src={person.picture || "/placeholder-person.jpg"}
              alt={person.name}
              className="w-full aspect-[3/4] object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="p-4">
              <h4 className="font-medium text-white group-hover:text-[#FF009F] transition-colors">
                {person.name}
              </h4>
              <p className="text-sm text-white/50">
                {person.job === "Diễn viên" ? "Actor" : person.job}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CastAndCrew;
