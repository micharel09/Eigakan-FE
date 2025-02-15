import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import actorService from "../../apis/Actor/actor";
import Loading from "../../components/Loading/Loading";

function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        const response = await actorService.getActorById(id);
        if (response.success) {
          setPerson(response.data);
        }
      } catch (error) {
        console.error("Error fetching person details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonDetails();
  }, [id]);

  if (loading) return <Loading />;
  if (!person) return null;

  return (
    <div className="min-h-screen bg-[#161515] pt-24 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{person.name} - Actor Details</title>
      </Helmet>
      <div className="max-w-7xl mx-auto ">
        <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-8">
          {/* Left Column - Image and Personal Info */}
          <div>
            <div className="rounded-lg overflow-hidden mb-6">
              <img
                src={person.picture}
                alt={person.name}
                className="w-full h-auto"
                onError={(e) => {
                  e.target.src = "/placeholder-actor.jpg";
                }}
              />
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-10">
              <h2 className="text-xl font-bold text-white mb-4">
                Personal Info
              </h2>

              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Known For
                  </h3>
                  <p>{person.job}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Known Credits
                  </h3>
                  <p>{person.movieList?.length || 0}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Gender
                  </h3>
                  <p>{person.gender ? "Nam" : "Nữ"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Birthday
                  </h3>
                  <p>{person.birthday}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Description
                  </h3>
                  <p>{person.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Biography and Known For */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-6">
              {person.name}
            </h1>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Biography</h2>
              <p className="text-gray-300 leading-relaxed">
                {person.description || "No biography available."}
              </p>
            </div>

            {person.movieList?.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Known For
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {person.movieList.map((movie) => (
                    <Link
                      key={movie.id}
                      to={`/movie/${movie.id}`}
                      className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105"
                    >
                      <div className="aspect-[2/3]">
                        <img
                          src={movie.medias}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="text-white text-sm font-medium">
                          {movie.title}
                        </h3>
                        <p className="text-gray-300 text-xs">
                          {movie.originName}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonDetail;
