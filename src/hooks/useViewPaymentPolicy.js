import { useState, useCallback } from "react";
import viewPaymentPolicyService from "../apis/ViewPaymentPolicy/viewPaymentPolicy";
import { toast } from "react-hot-toast";

const useViewPaymentPolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const fetchPolicies = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await viewPaymentPolicyService.getAllViewPaymentPolicies(page, pageSize);
      setPolicies(response.items || []);
      setTotalPages(Math.ceil(response.totalCount / pageSize));
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || "An error occurred while loading payment policies");
      toast.error(err.message || "An error occurred while loading payment policies");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const handlePageChange = useCallback((page) => {
    fetchPolicies(page);
  }, [fetchPolicies]);

  const createPolicy = useCallback(async (data) => {
    try {
      setLoading(true);
      await viewPaymentPolicyService.createViewPaymentPolicy(data);
      toast.success("Payment policy created successfully");
      fetchPolicies(1);
    } catch (err) {
      toast.error(err.message || "An error occurred while creating payment policy");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPolicies]);

  const updatePolicy = useCallback(async (id, data) => {
    try {
      setLoading(true);
      await viewPaymentPolicyService.updateViewPaymentPolicy(id, data);
      toast.success("Payment policy updated successfully");
      fetchPolicies(currentPage);
    } catch (err) {
      toast.error(err.message || "An error occurred while updating payment policy");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPolicies, currentPage]);

  const cancelPolicy = useCallback(async (data) => {
    try {
      setLoading(true);
      await viewPaymentPolicyService.cancelPolicy(data);
      toast.success("Payment policy cancelled successfully");
      fetchPolicies(currentPage);
    } catch (err) {
      toast.error(err.message || "An error occurred while cancelling payment policy");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchPolicies, currentPage]);

  return {
    policies,
    loading,
    error,
    totalPages,
    currentPage,
    pageSize,
    fetchPolicies,
    handlePageChange,
    createPolicy,
    updatePolicy,
    cancelPolicy,
  };
};

export default useViewPaymentPolicy; 