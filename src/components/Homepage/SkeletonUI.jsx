const SliderSkeleton = () => (
  <div className="h-[80vh] bg-gray-800 animate-pulse relative">
    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
    <div className="relative z-10 flex flex-col justify-center h-full ml-[5%] max-w-[45%] space-y-4">
      <div className="h-8 bg-gray-700 rounded-lg w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-24 bg-gray-700 rounded w-full" />
      <div className="h-10 bg-gray-700 rounded w-32" />
    </div>
  </div>
);

const MovieCardSkeleton = () => (
  <div className="flex-shrink-0">
    <div className="min-w-[150px] md:min-w-[200px] lg:min-w-[240px] h-[225px] md:h-[300px] lg:h-[360px] bg-gray-700 rounded-lg animate-pulse" />
  </div>
);

const MovieListSkeleton = () => (
  <div className="flex gap-4 overflow-x-hidden px-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <MovieCardSkeleton key={i} />
    ))}
  </div>
);

export { SliderSkeleton, MovieCardSkeleton, MovieListSkeleton };
