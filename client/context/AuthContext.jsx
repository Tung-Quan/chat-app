import axios from "axios";
import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const AuthContext = createContext(null);

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check-auth");
      if (data?.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
      }
    } catch (error) {
      console.error("Error during authentication check:", error);
      // Don't show error toast on auth check failure
    } finally {
      setLoading(false);
    }
  };

  // login function to handle user authentication and socket connection
  const login = async (state, credentials) => {
    try { 
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if(data.success){
        setAuthUser(data.userData);
        connectSocket(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message);
      }else{
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message);
    }
  }

  const logout = async () => {
    setAuthUser(null);
    setToken(null);
    localStorage.removeItem("token");
    // axios header will be removed by the effect reacting to `token` change

    if (socket) {
      socket.disconnect();
      // setSocket(null);
    }
    toast.success("Logged out successfully");
  }
  
  const updateProfile = async (updatedData) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", updatedData);

      if (data.success && data.userData) {
        setAuthUser(data.userData);
        toast.success(data.message);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    }
  }

  // connect socket function to be handled socket connection and online users update
  const connectSocket = (userData) => {
    if (!userData || socket?.connected)
      return;
    const newSocket = io(backendUrl, {
      query: {
        userId: userData.id || userData._id,
      }
    });
    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  }
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    } else {
      // remove token header when no token
      if (axios.defaults.headers && axios.defaults.headers.common) {
        delete axios.defaults.headers.common["token"];
      }
      setLoading(false);
    }
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
    loading
  }

  return (<AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
  )
};
