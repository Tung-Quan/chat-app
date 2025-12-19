import { useState, useEffect } from "react";
import { getAllUsers } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const UserProfileModal = ({ userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await getAllUsers();
        const foundUser = response.users.find(u => u._id === userId);
        if (foundUser) {
          setUser(foundUser);
        } else {
          toast.error("User not found");
          onClose();
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user profile");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, onClose]);

  const isOnline = user && onlineUsers.includes(user._id);

  const createdAtStr = (() => {
    if (!user) return "Unknown";
    
    let timestamp = user.createdAt;
    
    // Fallback: Extract timestamp from MongoDB ObjectId if createdAt is missing
    if (!timestamp && user._id) {
      try {
        const objectIdTimestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
        timestamp = new Date(objectIdTimestamp);
      } catch (e) {
        console.error("Failed to extract timestamp from _id:", e);
      }
    }
    
    if (!timestamp) return "Unknown";
    
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "Unknown";
    
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : user ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  {isOnline && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mt-4">{user.username}</h2>
                <p className="text-white/90 text-sm mt-1">
                  {isOnline ? "🟢 Online" : "⚫ Offline"}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                  {user.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 min-h-[100px] whitespace-pre-wrap">
                  {user.bio || "No bio available"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                  {createdAtStr}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default UserProfileModal;
