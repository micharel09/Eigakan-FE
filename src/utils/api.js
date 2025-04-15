import axios from "axios";

export const makeAuthenticatedRequest = async (apiCall) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found");
    }
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const response = await apiCall(headers);
    return response;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const makePublicRequest = async (apiCall, returnFullResponse = false) => {
  try {
    const response = await apiCall();
    return returnFullResponse ? response : response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

/**
 * Base API URL
 */
export const API_BASE_URL = "https://eigakan2222-001-site1.jtempurl.com/api";

/**
 * Base URLs for different API endpoints
 */
export const API_URLS = {
  BASE: API_BASE_URL,
  NEWS: `${API_BASE_URL}/News`,
  UPLOAD: `${API_BASE_URL}/Upload`,
  UPLOAD_PICTURES: `${API_BASE_URL}/Upload/Upload_Pictures`,
  AUTH: `${API_BASE_URL}/Auth`,
  MOVIE: `${API_BASE_URL}/Movie`,
  RATING: `${API_BASE_URL}/MovieRating`,
  COMMENT: `${API_BASE_URL}/Comment`,
  GENRE: `${API_BASE_URL}/Genre`,
  PERSON: `${API_BASE_URL}/Person`,
  AD_MEDIA: `${API_BASE_URL}/AdMedia`,
  AD_PURCHASE_SLOT: `${API_BASE_URL}/AdPurchaseSlot`,
  AD_SLOT: `${API_BASE_URL}/AdSlot`,
  AD_SLOT_TIME: `${API_BASE_URL}/AdSlotTime`,
  AD_SLOT_TIME_RANGE: `${API_BASE_URL}/AdSlotTimeRange`,
  AD_PACKAGE: `${API_BASE_URL}/AdPackage`,
  AD_PURCHASE_TRANSACTION: `${API_BASE_URL}/AdPurchaseTransaction`,
  VIEW_PAYMENT_POLICY: `${API_BASE_URL}/ViewPaymentPolicy`,
  AD_MEDIA_COUNT: `${API_BASE_URL}/AdMediaCount`,
  CONTRACT: `${API_BASE_URL}/contracts`,
  MEDIA: `${API_BASE_URL}/Media`,
  MOVIE_COUNT: `${API_BASE_URL}/MovieCount`,
  MOVIE_EARNING: `${API_BASE_URL}/MovieEarning`,
  MOVIE_HISTORY: `${API_BASE_URL}/MovieHistory`,
  ROOM: `${API_BASE_URL}/Room`,
  SUBSCRIPTION_PACKAGE: `${API_BASE_URL}/SubscriptionPackage`,
  SUBSCRIPTION_PURCHASE_PAYMENT: `${API_BASE_URL}/SubscriptionPurchasePayment`,
  USER: `${API_BASE_URL}/User`,
  USER_EARNING: `${API_BASE_URL}/UserEarning`,
  USER_REGISTER: `${API_BASE_URL}/UserRegister`,
}; 