import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";

/**
 * Custom hook for path and route related functionality
 * Provides utilities for checking active routes and path matching
 */
const usePath = () => {
  const location = useLocation();
  
  // Current path memo
  const currentPath = useMemo(() => location.pathname, [location.pathname]);
  
  // Check if path is included in current location path
  const isInPath = useCallback(
    (path) => {
      if (!path) return false;
      return location.pathname.includes(path);
    },
    [location.pathname]
  );
  
  // Check if the current path exactly matches a path
  const isExactPath = useCallback(
    (path) => {
      if (!path) return false;
      return location.pathname === path;
    },
    [location.pathname]
  );
  
  // Check if current path starts with a given prefix
  const pathStartsWith = useCallback(
    (prefix) => {
      if (!prefix) return false;
      return location.pathname.startsWith(prefix);
    },
    [location.pathname]
  );
  
  // Check if path matches any prefix in a list
  const matchesAnyPrefix = useCallback(
    (prefixes) => {
      if (!Array.isArray(prefixes) || prefixes.length === 0) return false;
      return prefixes.some((prefix) => location.pathname.startsWith(prefix));
    },
    [location.pathname]
  );
  
  // Extract path parameters for a dynamic route
  // Example: extractParams("/user/:id", "/user/123") returns { id: "123" }
  const extractParams = useCallback(
    (routePattern, pathToMatch = location.pathname) => {
      const routeParts = routePattern.split("/").filter(Boolean);
      const pathParts = pathToMatch.split("/").filter(Boolean);
      
      if (routeParts.length !== pathParts.length) return null;
      
      const params = {};
      let isMatch = true;
      
      routeParts.forEach((part, index) => {
        if (part.startsWith(":")) {
          // This is a parameter
          const paramName = part.substring(1);
          params[paramName] = pathParts[index];
        } else if (part !== pathParts[index]) {
          // Static part doesn't match
          isMatch = false;
        }
      });
      
      return isMatch ? params : null;
    },
    [location.pathname]
  );
  
  return {
    currentPath,
    isInPath,
    isExactPath,
    pathStartsWith,
    matchesAnyPrefix,
    extractParams,
    searchParams: new URLSearchParams(location.search),
    hash: location.hash,
  };
};

export default usePath;
