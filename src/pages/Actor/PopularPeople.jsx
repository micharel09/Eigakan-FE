import React, { useEffect, useState } from "react";
import GlobalApi from "../../components/Homepage/GlobalApi";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Loading from "../../components/Loading/Loading";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function PopularPeople() {
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPeople();
  }, [page]);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const response = await GlobalApi.getPopularPeople(page);
      if (page === 1) {
        setPeople(response.data.results);
      } else {
        setPeople((prev) => [...prev, ...response.data.results]);
      }
    } catch (error) {
      console.error("Error fetching popular people:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#161515] pt-24 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Actors - Popular People</title>
      </Helmet>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Popular People</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {people.map((person) => (
            <Link
              key={person.id}
              to={`/person/${person.id}`}
              className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105"
            >
              <div className="aspect-[2/3]">
                <img
                  src={
                    person.profile_path
                      ? `${IMAGE_BASE_URL}${person.profile_path}`
                      : "/placeholder-person.jpg"
                  }
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-white text-sm font-medium truncate">
                  {person.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        {!loading && (
          <div className="flex justify-center mt-8 mb-12">
            <button
              onClick={loadMore}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PopularPeople;
