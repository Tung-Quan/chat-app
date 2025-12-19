import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useChat } from "../hooks/useChat";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { getAllUsers } from "../lib/api";
import { Trash2 } from "lucide-react";

const Profile = () => {
  const { authUser, updateProfile, onlineUsers } = useAuth();
  const { deleteUserAccount } = useChat();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [viewedUser, setViewedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isOwnProfile = !userId || userId === authUser?._id;
  const displayUser = isOwnProfile ? authUser : viewedUser;
  
  const [formData, setFormData] = useState({
    username: authUser?.username || "",
    bio: authUser?.bio || "",
    profilePicture: ""
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await getAllUsers();
        const user = response.users.find(u => u._id === userId);
        if (user) {
          setViewedUser(user);
        } else {
          toast.error("User not found");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load user profile");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    
    if (userId && userId !== authUser?._id) {
      fetchUserProfile();
    }
  }, [userId, authUser, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (authUser?._id) {
      await deleteUserAccount(authUser._id);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  const isOnline = displayUser && onlineUsers.includes(displayUser._id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {isOwnProfile ? "Edit Profile" : `${displayUser?.username}'s Profile`}
          </h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base">
          
            Back to Chat
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 sm:mb-8 gap-4">
          <div className="relative">
            <img
              src={isOwnProfile ? (formData.profilePicture || authUser?.profilePicture) : displayUser?.profilePicture}
              alt="Profile"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-blue-500"
            />
            {!isOwnProfile && isOnline && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{displayUser?.username}</h2>
            <p className="text-sm sm:text-base text-gray-600">{displayUser?.email}</p>
            {!isOwnProfile && (
              <p className="text-sm text-gray-500 mt-1">
                {isOnline ? "🟢 Online" : "⚫ Offline"}
              </p>
            )}
          </div>
        </div>

        {isOwnProfile ? (
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              rows="4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Change Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition duration-200"
          >
            Update Profile
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition duration-200 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
        </form>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {displayUser?.username}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 min-h-[120px]">
                {displayUser?.bio || "No bio available"}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {displayUser?.email}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Delete Account?
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
