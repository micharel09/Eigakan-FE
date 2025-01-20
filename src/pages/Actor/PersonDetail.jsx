import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import GlobalApi from "../../components/Homepage/GlobalApi";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

function PersonDetail() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        const response = await GlobalApi.getPersonDetails(id);
        const creditsResponse = await GlobalApi.getPersonCredits(id);
        setPerson({
          ...response.data,
          credits: creditsResponse.data,
        });
      } catch (error) {
        console.error("Error fetching person details:", error);
      }
    };

    fetchPersonDetails();
  }, [id]);

  if (!person) return null;

  const knownMovies = person.credits?.cast
    ?.sort((a, b) => b.popularity - a.popularity)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-[#161515] pt-24 px-4 sm:px-6 lg:px-8">
      {" "}
      <Helmet>
        <title>{person.name} - Actor Details</title>
      </Helmet>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-8">
          {/* Left Column - Image and Personal Info */}
          <div>
            <div className="rounded-lg overflow-hidden mb-6">
              <img
                src={`${IMAGE_BASE_URL}${person.profile_path}`}
                alt={person.name}
                className="w-full h-auto"
              />
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Personal Info
              </h2>

              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Known For
                  </h3>
                  <p>{person.known_for_department}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Known Credits
                  </h3>
                  <p>{person.credits?.cast?.length || 0}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Gender
                  </h3>
                  <p>{person.gender === 1 ? "Female" : "Male"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-400">
                    Birthday
                  </h3>
                  <p>{new Date(person.birthday).toLocaleDateString()}</p>
                </div>

                {person.place_of_birth && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400">
                      Place of Birth
                    </h3>
                    <p>{person.place_of_birth}</p>
                  </div>
                )}
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
                {person.biography || "No biography available."}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Known For</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {knownMovies?.map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105"
                  >
                    <div className="aspect-[2/3]">
                      <img
                        src={
                          movie.poster_path
                            ? `${POSTER_BASE_URL}${movie.poster_path}`
                            : "/placeholder.jpg"
                        }
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h3 className="text-white text-sm font-medium">
                        {movie.title}
                      </h3>
                      <p className="text-gray-300 text-xs">
                        {movie.release_date?.split("-")[0]}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonDetail;
