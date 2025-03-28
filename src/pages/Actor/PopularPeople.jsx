import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import actorService from "../../apis/Actor/actor";
import Loading from "../../components/Loading/Loading";

function PopularPeople() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const response = await actorService.getActors(1, 10);
        if (response.success) {
          setActors(response.data);
        }
      } catch (error) {
        console.error("Error fetching actors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActors();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Popular People - Eigakan</title>
      </Helmet>

      {/* Smaller gradient transition from navbar that won't interfere with movie pages */}
      <div className="w-full h-16 bg-gradient-to-b from-black via-black/90 to-black/70"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Popular People</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {actors.map((actor) => (
            <Link key={actor.id} to={`/person/${actor.id}`} className="group">
              <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2">
                <img
                  src={actor.picture}
                  alt={actor.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-200"
                  onError={(e) => {
                    e.target.src = "/placeholder-actor.jpg";
                  }}
                />
              </div>
              <h2 className="text-white font-medium group-hover:text-[#FF009F] transition-colors">
                {actor.name}
              </h2>
              <p className="text-sm text-gray-400">
                {actor.job || "Diễn viên"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PopularPeople;
