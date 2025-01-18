import React, { useEffect, useRef, useState } from "react";

const FadeInSection = ({ children }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => setVisible(entry.isIntersecting));
    });

    observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
};

export default FadeInSection;
