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

export const editMessage = async (messageId, text) => {
  const response = await axios.put(`/api/messages/edit/${messageId}`, { text });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axios.delete(`/api/users/${userId}`);
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

// API functions for groups
export const createGroup = async (groupData) => {
  const response = await axios.post("/api/groups/create", groupData);
  return response.data;
};

export const getGroups = async () => {
  const response = await axios.get("/api/groups");
  return response.data;
};

export const getGroupMessages = async (groupId) => {
  const response = await axios.get(`/api/groups/${groupId}/messages`);
  return response.data;
};

export const sendGroupMessage = async (groupId, message) => {
  const response = await axios.post(`/api/groups/${groupId}/send`, message);
  return response.data;
};

export const addGroupMember = async (groupId, userId) => {
  const response = await axios.post(`/api/groups/${groupId}/add-member`, { userId });
  return response.data;
};

export const removeGroupMember = async (groupId, userId) => {
  const response = await axios.delete(`/api/groups/${groupId}/remove-member/${userId}`);
  return response.data;
};

export const deleteGroupMessage = async (messageId) => {
  const response = await axios.delete(`/api/groups/message/${messageId}`);
  return response.data;
};

export const editGroupMessage = async (messageId, text) => {
  const response = await axios.put(`/api/groups/message/${messageId}`, { text });
  return response.data;
};

export const updateGroup = async (groupId, groupData) => {
  const response = await axios.put(`/api/groups/${groupId}`, groupData);
  return response.data;
};
export const deleteGroup = async (groupId) => {
  const response = await axios.delete(`/api/groups/${groupId}`);
  return response.data;
};