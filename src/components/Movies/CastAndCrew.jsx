import React, { useCallback, memo } from "react";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import GlobalApi from "../Homepage/GlobalApi";

const CastAndCrew = ({ persons }) => {
  if (!persons?.length) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-white">Cast & Crew</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {persons.map((person) => (
          <div
            key={person.id}
            className="bg-gray-800/50 rounded-lg overflow-hidden"
          >
            <img
              src={person.picture || "/placeholder-person.jpg"}
              alt={person.name}
              className="w-full aspect-[3/4] object-cover"
            />
            <div className="p-4">
              <h3 className="font-medium text-white">{person.name}</h3>
              <p className="text-sm text-gray-400">{person.job}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CastAndCrew;
