import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

// API functions for messages
export const getAllUsers = async () => {
  const response = await axios.get("/api/messages/users");
  return response.data;
};

export const getMessages = async (userId) => {
  const response = await axios.get(`/api/messages/${userId}`);
  return response.data;
};

export const sendMessage = async (userId, message) => {
  const response = await axios.post(`/api/messages/send/${userId}`, message);
  return response.data;
};

export const markMessagesAsSeen = async (userId) => {
  const response = await axios.put(`/api/messages/mark-seen/${userId}`);
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await axios.delete(`/api/messages/${messageId}`);
  return response.data;
};

// API functions for auth
export const signup = async (userData) => {
  const response = await axios.post("/api/auth/signup", userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await axios.post("/api/auth/login", credentials);
  return response.data;
};

export const checkAuth = async () => {
  const response = await axios.get("/api/auth/check-auth");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axios.put("/api/auth/update-profile", profileData);
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await axios.get(`/api/messages/users/${userId}`);
  return response.data;
};
