import React, { Suspense, useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  SliderSkeleton,
  MovieListSkeleton,
} from "../../components/Homepage/SkeletonUI";
import FadeInSection from "../../components/Homepage/FadeInSection";
import Navbar from "../../components/Header/Navbar";
import Slider from "../../components/Homepage/Slider";
import Loading from "../../components/Loading/Loading";
import { PlayCircle } from "lucide-react";
import { Button } from "antd";
import { CrownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// Lazy load components
const ProductionHouse = React.lazy(() =>
  import("../../components/Homepage/ProductionHouse")
);
const GenreMovieList = React.lazy(() =>
  import("../../components/Homepage/GenresMovieList")
);

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const isVipMember = role === "VIP MEMBER";

  useEffect(() => {
    // Kiểm tra subscription status từ localStorage hoặc API
    const checkSubscriptionStatus = () => {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        // Giả sử API trả về subscriptionStatus trong user data
        setHasActiveSubscription(userData.subscriptionStatus === "Active");
      }
    };

    checkSubscriptionStatus();
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="relative bg-gray-900">
      <Helmet>
        <title>Home</title>
      </Helmet>

      <div className="w-full">
        <div className="space-y-12 pb-12">
          <Suspense fallback={<SliderSkeleton />}>
            <Slider />
          </Suspense>

          <FadeInSection>
            <Suspense fallback={<MovieListSkeleton />}>
              <ProductionHouse />
            </Suspense>
          </FadeInSection>

          <FadeInSection>
            <Suspense
              fallback={
                <div className="space-y-8">
                  {[1, 2, 3].map((i) => (
                    <MovieListSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <GenreMovieList />
            </Suspense>
          </FadeInSection>
        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default HomeScreen;
