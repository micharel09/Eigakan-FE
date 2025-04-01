"use client"

import { useState, useEffect } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { Button, notification, Spin, Typography } from "antd"
import {
  LoadingOutlined,
  PlayCircleFilled,
  TeamOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons"
import movieService from "../../apis/Movie/movie"

const { Title, Text } = Typography

// Room service implementation
const roomService = {
  getRoomDetails: async (roomId) => {
    console.log("Fetching room details for:", roomId)
    return {
      success: true,
      data: {
        id: roomId,
        movieID: "movie123",
        name: "Movie Night",
        isVIP: false,
      },
    }
  },

  joinRoom: async ({ roomId, userId, movieId }) => {
    console.log("Joining room:", { roomId, userId, movieId })
    return {
      success: true,
      data: {
        roomId,
        movieID: movieId,
      },
    }
  },
}

const useUser = () => {
  return {
    user: { userId: "userid: 123456" },
    isLoading: false,
    token: "mock-token",
  }
}

const WaitingRoom = () => {
  const { movieId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const roomId = queryParams.get("roomId")

  const [isJoining, setIsJoining] = useState(false)
  const [movieDetails, setMovieDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bannerUrl, setBannerUrl] = useState("")
  const [posterUrl, setPosterUrl] = useState("")

  const { user, token } = useUser()

  useEffect(() => {
    const fetchMovieData = async () => {
      setIsLoading(true)
      try {
        const response = await movieService.getMovieById(movieId)
        if (response.success) {
          console.log("Movie data:", response.data)
          setMovieDetails(response.data)

          // Extract banner and poster URLs from media
          if (response.data.medias) {
            const banner = response.data.medias.find((media) => media.type === "BANNER")
            const poster = response.data.medias.find((media) => media.type === "POSTER")

            if (banner) setBannerUrl(banner.url)
            if (poster) setPosterUrl(poster.url)
          }
        } else {
          notification.error({
            message: "Failed to load movie",
            description: response.message || "Could not load movie details",
          })
        }
      } catch (error) {
        notification.error({
          message: "Failed to load movie",
          description: error.message || "Could not load movie details",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (movieId) fetchMovieData()
  }, [movieId])

  const handleJoinRoom = async () => {
    if (isJoining || !roomId?.trim()) return
    setIsJoining(true)

    try {
      if (!token) {
        notification.error({
          message: "Authentication Required",
          description: "Please login to join a watch room",
        })
        navigate("/login")
        return
      }

      const userId = user?.userId?.replace(/^userid:\s*/i, "")
      if (!userId) {
        notification.error({
          message: "User Data Missing",
          description: "Please try logging in again",
        })
        return
      }

      const roomDetails = await roomService.getRoomDetails(roomId.trim())

      if (roomDetails?.success === false) {
        notification.error({
          message: "Error",
          description: roomDetails?.message || "Room details not available.",
        })
        return
      }

      let currentMovieId = roomDetails.success ? roomDetails.data?.movieID : null

      if (!currentMovieId) {
        currentMovieId = movieId
      }

      const joinResponse = await roomService.joinRoom({
        roomId: roomId.trim(),
        userId,
        movieId: currentMovieId || "",
      })

      if (joinResponse.success) {
        notification.success({
          message: "Success!",
          description: "Joined room successfully!",
        })

        if (!currentMovieId && joinResponse.data) {
          currentMovieId = Array.isArray(joinResponse.data) ? joinResponse.data[0]?.movieID : joinResponse.data.movieID
        }

        navigate(
          `/watch-together/${currentMovieId || "undefined"}?roomId=${roomId.trim()}&movieId=${currentMovieId || ""}`,
        )
      } else {
        throw new Error(joinResponse.message || "Could not join room")
      }
    } catch (error) {
      notification.error({
        message: "Failed to join room",
        description: error.message,
      })
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: "#1890ff" }} spin />} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${bannerUrl})`,
      }}
    >
      {/* Gradient overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40"></div>

      {/* Animated particles or light effect (optional) */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"
          style={{ top: "10%", left: "15%" }}
        ></div>
        <div
          className="absolute w-60 h-60 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-pulse"
          style={{ top: "60%", right: "10%", animationDelay: "1s" }}
        ></div>
      </div>

      <div className="z-10 w-full max-w-md px-4">
        {/* Glass card effect */}
        <div className="backdrop-blur-md bg-white/10 rounded-3xl overflow-hidden border border-white/20 shadow-2xl transform transition-all duration-300 hover:scale-[1.01]">
          {/* Header with poster */}
          <div className="relative">
            {/* Banner image at top */}
            <div className="h-32 w-full bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
              {bannerUrl && (
                <div className="absolute inset-0 opacity-30">
                  <img src={bannerUrl || "/placeholder.svg"} alt="banner" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

              {/* Room ID badge */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                <Text className="text-white text-xs">Room #{roomId?.substring(0, 8) || "Unknown"}</Text>
              </div>
            </div>

            {/* Poster overlapping the banner */}
            <div className="absolute -bottom-16 left-6 w-28 h-40 rounded-xl overflow-hidden border-4 border-white shadow-xl transform transition-transform duration-300 hover:scale-105">
              <img
                src={posterUrl || "/placeholder.svg"}
                alt={movieDetails?.title || "Movie poster"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="pt-20 pb-6 px-6">
            <Title level={3} className="text-white mb-1 leading-tight">
              {movieDetails?.title || "Movie Title"}
            </Title>

            {movieDetails?.genreNames && (
              <div className="flex flex-wrap gap-2 mb-4">
                {movieDetails.genreNames.split(", ").map((genre, index) => (
                  <span key={index} className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {movieDetails?.director && (
                <div className="flex items-center gap-2">
                  <VideoCameraOutlined className="text-blue-400" />
                  <div>
                    <Text className="text-white/60 text-xs block">Director</Text>
                    <Text className="text-white text-sm">{movieDetails.director}</Text>
                  </div>
                </div>
              )}

              {movieDetails?.duration && (
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-blue-400" />
                  <div>
                    <Text className="text-white/60 text-xs block">Duration</Text>
                    <Text className="text-white text-sm">{movieDetails.duration} min</Text>
                  </div>
                </div>
              )}

              {movieDetails?.releaseYear && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="text-blue-400 w-4 h-4" />
                  <div>
                    <Text className="text-white/60 text-xs block">Year</Text>
                    <Text className="text-white text-sm">{movieDetails.releaseYear}</Text>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <TeamOutlined className="text-blue-400" />
                <div>
                  <Text className="text-white/60 text-xs block">Watch Party</Text>
                  <Text className="text-white text-sm">Ready to join</Text>
                </div>
              </div>
            </div>

            {/* Description with gradient fade */}
            {movieDetails?.description && (
              <div className="relative mb-6 h-20 overflow-hidden">
                <Text className="text-white/80 text-sm leading-relaxed">{movieDetails.description}</Text>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/90 to-transparent"></div>
              </div>
            )}

            {/* Join button with animation */}
            <Button
              type="primary"
              icon={<PlayCircleFilled />}
              className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 border-0 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:from-blue-600 hover:to-purple-700"
              onClick={handleJoinRoom}
              disabled={isJoining || !roomId}
              loading={isJoining}
            >
              {isJoining ? "Joining..." : "Join Watch Party"}
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <Text className="block text-center text-white/60 text-xs mt-4">
          Join this room to watch "{movieDetails?.title}" together with friends
        </Text>
      </div>
    </div>
  )
}

// Calendar icon component
const CalendarIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

export default WaitingRoom

