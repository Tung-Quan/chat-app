import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import { useGroup } from "../hooks/useGroup";
import { useNavigate } from "react-router-dom";
import UserProfileModal from "./UserProfileModal";
import CreateGroupModal from "./CreateGroupModal";
import { useState, useEffect } from "react";
import { Users, MessageCircle, Plus, Terminal as TerminalIcon } from "lucide-react";

const Sidebar = ({ onSelectUser }) => {
  const { users = [], selectedUser, setSelectedUser, unSeenMessages = {} } = useChat();
  const { groups = [], selectedGroup, setSelectedGroup, fetchGroups } = useGroup();
  const { authUser, onlineUsers = [], logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    if (activeTab === "groups") {
      fetchGroups();
    }
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    if (onSelectUser) onSelectUser(user);
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
    if (onSelectUser) onSelectUser(null);
  };

  const handleUserRightClick = (e, userId) => {
    e.preventDefault();
    setViewingUserId(userId);
    setShowProfileModal(true);
  };

  return (
    <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
      {showProfileModal && viewingUserId && (
        <UserProfileModal
          userId={viewingUserId}
          onClose={() => {
            setShowProfileModal(false);
            setViewingUserId(null);
          }}
        />
      )}

      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <img
              src={authUser?.profilePicture}
              alt="Profile"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white flex-shrink-0"
            />
            <div className="min-w-0">
              <h2 className="font-semibold text-white text-sm sm:text-base truncate">{authUser?.username}</h2>
              <p className="text-xs text-white/80">Online</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate("/terminal")}
              className="p-2 hover:bg-white/20 rounded-full transition"
              title="Server Terminal"
            >
              <TerminalIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="p-2 hover:bg-white/20 rounded-full transition"
              title="Profile"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/20 rounded-full transition"
              title="Logout"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition ${
            activeTab === "users"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Direct</span>
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition ${
            activeTab === "groups"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Groups</span>
        </button>
      </div>

      {/* Create Group Button */}
      {activeTab === "groups" && (
        <div className="p-3">
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>
      )}

      {/* Users/Groups List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "users" ? (
          users.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const hasUnseenMessages = (unSeenMessages[user._id] || 0) > 0;

            return (
              <div
                key={user._id}
                onClick={() => handleUserClick(user)}
                onContextMenu={(e) => handleUserRightClick(e, user._id)}
                title="Right-click to view profile"
                className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 group ${
                  selectedUser?._id === user._id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    />
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 truncate text-sm sm:text-base">
                        {user.username}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {hasUnseenMessages && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                            {unSeenMessages[user._id]}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserRightClick(e, user._id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full transition opacity-0 group-hover:opacity-100"
                          title="View profile"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{user.bio || "No bio"}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          groups.map((group) => {
            return (
              <div
                key={group._id}
                onClick={() => handleGroupClick(group)}
                className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                  selectedGroup?._id === group._id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="relative flex-shrink-0">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 truncate text-sm sm:text-base">
                        {group.name}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {group.members?.length || 0} members
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {group.lastMessage?.text || group.description || "No messages yet"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateGroupModal && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
