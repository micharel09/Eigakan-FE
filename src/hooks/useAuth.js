import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../apis/Auth/auth";

/**
 * Custom hook for authentication and user state management
 * Handles user data, authentication status, and role-based access control
 */
const useAuth = () => {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });
  
  const navigate = useNavigate();
  
  // Define role constants
  const ROLES = {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    PUBLISHER: "PUBLISHER",
    ADVERTISER: "ADVERTISER",
    MEMBER: "MEMBER",
    VIP_MEMBER: "VIP MEMBER",
  };

  // Memoize token and role values
  const token = useMemo(() => localStorage.getItem("token"), []);
  const role = useMemo(() => user?.roleName || localStorage.getItem("role"), [user]);
  
  // Memoize role checks to prevent unnecessary recalculations
  const userRoles = useMemo(() => {
    return {
      isAdmin: role === ROLES.ADMIN,
      isManager: role === ROLES.MANAGER,
      isPublisher: role === ROLES.PUBLISHER,
      isAdvertiser: role === ROLES.ADVERTISER,
      isVipMember: role === ROLES.VIP_MEMBER,
      isMember: role === ROLES.MEMBER,
    };
  }, [role, ROLES]);
  
  // Memoize user authentication status
  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

  // Setup user update from auth service
  useEffect(() => {
    const updateUser = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    };
    
    // Add listener for auth changes
    authService.addListener(updateUser);
    
    // Initial check
    updateUser();
    
    // Clean up listener
    return () => authService.removeListener(updateUser);
  }, []);
  
  // Listen for role changes
  useEffect(() => {
    const handleRoleChange = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    };
    
    window.addEventListener("userRoleChanged", handleRoleChange);
    return () => window.removeEventListener("userRoleChanged", handleRoleChange);
  }, []);
  
  // Logout function
  const handleLogout = useCallback(() => {
    const keysToRemove = [
      "user",
      "token",
      "fullName",
      "avatar",
      "role",
      "userId",
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    setUser(null);
    navigate("/login");
  }, [navigate]);
  
  // Check if user has specific role
  const hasRole = useCallback((roleToCheck) => {
    return role === roleToCheck;
  }, [role]);
  
  // Check if user has any of the provided roles
  const hasAnyRole = useCallback((rolesToCheck) => {
    return Array.isArray(rolesToCheck) ? rolesToCheck.includes(role) : false;
  }, [role]);

  return {
    user,
    setUser,
    token,
    role,
    isAuthenticated,
    handleLogout,
    hasRole,
    hasAnyRole,
    ...userRoles,
    ROLES,
  };
};

export default useAuth; 