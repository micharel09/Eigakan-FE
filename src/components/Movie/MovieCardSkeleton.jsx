const MovieCardSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="flex flex-col md:flex-row gap-8">
      <div className="md:w-1/3 flex flex-col gap-4">
        <div className="animate-pulse bg-gray-700 rounded-lg aspect-[2/3] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800" />
        </div>
        <div className="animate-pulse bg-red-700/50 h-12 rounded-md" />
      </div>
      <div className="md:w-2/3">
        <div className="flex flex-col gap-6">
          <div className="animate-pulse bg-gray-700 h-10 w-3/4 rounded-lg" />
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-700 h-8 w-20 rounded-full"
              />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-700 h-4 rounded w-full"
              />
            ))}
          </div>
          <div className="animate-pulse bg-gray-700 aspect-video rounded-lg mt-4" />
        </div>
      </div>
    </div>
  </div>
);

export default MovieCardSkeleton;
