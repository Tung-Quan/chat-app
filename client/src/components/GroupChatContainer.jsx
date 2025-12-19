import { useGroup } from "../hooks/useGroup";
import { useAuth } from "../hooks/useAuth";
import MessageInput from "./MessageInput";
import { useEffect, useRef, useState } from "react";
import { Users, Settings, UserPlus, UserMinus, Edit2, X, Upload, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { addGroupMember, removeGroupMember } from "../lib/api";
import { useChat } from "../hooks/useChat";

const GroupChatContainer = () => {
  const { selectedGroup, groupMessages, loading, deleteMessage, sendMessage, editMessage, updateGroupInfo, deleteGroup } = useGroup();
  const { authUser } = useAuth();
  const { users } = useChat();
  const messagesEndRef = useRef(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimer = useRef(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);

  const handleDeleteMessage = async (messageId) => {
    setContextMenu(null);
    if (window.confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId);
    }
  };

  const handleStartEdit = (message) => {
    setContextMenu(null);
    setEditingMessage(message._id);
    setEditText(message.text || "");
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) {
      return;
    }
    try {
      await editMessage(messageId, editText);
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  // Long press handlers for mobile
  const handleTouchStart = (message) => {
    longPressTimer.current = setTimeout(() => {
      setContextMenu(message);
    }, 500); // 0.5 seconds
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleMouseDown = (message) => {
    longPressTimer.current = setTimeout(() => {
      setContextMenu(message);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleOpenEditGroup = () => {
    setGroupName(selectedGroup?.name || "");
    setGroupDescription(selectedGroup?.description || "");
    setAvatarPreview(selectedGroup?.avatar || "");
    setGroupAvatar(null);
    setShowEditGroupModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupAvatar(reader.result);
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsUpdating(true);
    try {
      await updateGroupInfo(selectedGroup._id, {
        name: groupName,
        description: groupDescription,
        avatar: groupAvatar || selectedGroup.avatar
      });
      setShowEditGroupModal(false);
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm(`Are you sure you want to delete "${selectedGroup?.name}"? This action cannot be undone and will delete all messages.`)) {
      try {
        await deleteGroup(selectedGroup._id);
        setShowGroupDetails(false);
      } catch (error) {
        console.error("Error deleting group:", error);
      }
    }
  };

  const handleKickMember = async (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
      try {
        await removeGroupMember(selectedGroup._id, memberId);
        toast.success(`${memberName} has been removed from the group`);
      } catch (error) {
        console.error("Error removing member:", error);
        toast.error("Failed to remove member");
      }
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsersToAdd.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      for (const userId of selectedUsersToAdd) {
        await addGroupMember(selectedGroup._id, userId);
      }
      toast.success(`${selectedUsersToAdd.length} member(s) added successfully`);
      setShowAddMemberModal(false);
      setSelectedUsersToAdd([]);
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error("Failed to add some members");
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsersToAdd(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const isAdmin = selectedGroup?.admins?.some(admin => 
    typeof admin === 'string' ? admin === authUser?._id : admin._id === authUser?._id
  );

  const isCreator = selectedGroup?.creator?._id === authUser?._id || selectedGroup?.creator === authUser?._id;

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getSenderInfo = (senderId) => {
    if (typeof senderId === 'object') {
      return {
        id: senderId._id,
        username: senderId.username,
        profilePicture: senderId.profilePicture
      };
    }
    // If sender is just an ID, we'll need to find it from group members
    const member = selectedGroup?.members?.find(m => 
      (typeof m === 'string' ? m : m._id) === senderId
    );
    if (typeof member === 'object') {
      return {
        id: member._id,
        username: member.username,
        profilePicture: member.profilePicture
      };
    }
    return null;
  };

  const renderMessageText = (text, isMine) => {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-2 hover:underline-offset-4 transition-all ${
              isMine ? 'text-white font-medium' : 'text-blue-600 font-medium'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Group Header */}
      <div className="p-4 pl-16 md:pl-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative cursor-pointer hover:opacity-80 transition">
              {selectedGroup?.avatar ? (
                <img
                  src={selectedGroup.avatar}
                  alt={selectedGroup.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                  <Users className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white text-base sm:text-lg">
                {selectedGroup?.name}
              </h2>
              <p className="text-xs sm:text-sm text-white/80">
                {selectedGroup?.members?.length || 0} members
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={handleOpenEditGroup}
                className="p-2 hover:bg-white/20 rounded-full transition"
                title="Edit group"
              >
                <Edit2 className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={() => setShowGroupDetails(!showGroupDetails)}
              className="p-2 hover:bg-white/20 rounded-full transition"
              title="Group details"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Group Modal */}
      {showEditGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Edit Group
                </h2>
                <button
                  onClick={() => setShowEditGroupModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateGroup} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Group avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition">
                      <Upload className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter group name"
                    required
                  />
                </div>

                {/* Group Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter group description (optional)"
                    rows="3"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditGroupModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Panel */}
      {showGroupDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Group Details
                </h2>
                <button
                  onClick={() => setShowGroupDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Group Avatar and Name */}
              <div className="flex flex-col items-center mb-6">
                {selectedGroup?.avatar ? (
                  <img
                    src={selectedGroup.avatar}
                    alt={selectedGroup.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 mb-3"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-3">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-800">{selectedGroup?.name}</h3>
                {selectedGroup?.description && (
                  <p className="text-sm text-gray-600 text-center mt-2">{selectedGroup.description}</p>
                )}
              </div>

              {/* Group Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Created by</span>
                  <span className="text-sm font-medium text-gray-800">
                    {typeof selectedGroup?.creator === 'object' 
                      ? selectedGroup.creator.username 
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Members</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedGroup?.members?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedGroup?.createdAt 
                      ? new Date(selectedGroup.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Members List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Members ({selectedGroup?.members?.length || 0})
                  </h4>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedGroup?.members?.map((member) => {
                    const memberId = typeof member === 'string' ? member : member._id;
                    const memberData = typeof member === 'object' ? member : null;
                    const isGroupAdmin = selectedGroup?.admins?.some(admin => 
                      (typeof admin === 'string' ? admin : admin._id) === memberId
                    );
                    const isMemberCreator = selectedGroup?.creator?._id === memberId || selectedGroup?.creator === memberId;

                    return (
                      <div
                        key={memberId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          {memberData?.profilePicture && (
                            <img
                              src={memberData.profilePicture}
                              alt={memberData.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-800">
                              {memberData?.username || 'Unknown'}
                              {memberId === authUser?._id && (
                                <span className="text-xs text-blue-500 ml-2">(You)</span>
                              )}
                            </p>
                            {memberData?.email && (
                              <p className="text-xs text-gray-500">{memberData.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isGroupAdmin && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                              Admin
                            </span>
                          )}
                          {isAdmin && !isMemberCreator && memberId !== authUser?._id && (
                            <button
                              onClick={() => handleKickMember(memberId, memberData?.username || 'Unknown')}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                              title="Remove member"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin && (
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => {
                      setShowGroupDetails(false);
                      handleOpenEditGroup();
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Group
                  </button>
                  {isCreator && (
                    <button
                      onClick={handleDeleteGroup}
                      className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Group
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : groupMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the group conversation!</p>
            </div>
          </div>
        ) : (
          groupMessages.map((message) => {
            const isMine = (typeof message.sender === 'string' ? message.sender : message.sender?._id) === authUser?._id;
            const senderInfo = !isMine ? getSenderInfo(message.sender) : null;
            
            return (
              <div
                key={message._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
                onMouseEnter={() => setHoveredMessage(message._id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                  {!isMine && senderInfo && (
                    <img
                      src={senderInfo.profilePicture}
                      alt={senderInfo.username}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      title={senderInfo.username}
                    />
                  )}
                  
                  <div className={`flex-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMine && senderInfo && (
                      <span className="text-xs text-gray-600 mb-1 ml-2">
                        {senderInfo.username}
                      </span>
                    )}
                    
                    <div className="relative">
                      {editingMessage === message._id ? (
                        // Edit mode
                        <div className="bg-white rounded-2xl px-3 sm:px-4 py-2 shadow-sm border-2 border-blue-500">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 border-0 focus:outline-none resize-none text-sm sm:text-base"
                            rows="2"
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSaveEdit(message._id)}
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-xs hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div
                          className={`inline-block ${
                            isMine
                              ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                              : "bg-white text-gray-800"
                          } rounded-2xl px-3 sm:px-4 py-2 shadow-sm`}
                          onTouchStart={() => (isMine || isAdmin) && handleTouchStart(message)}
                          onTouchEnd={handleTouchEnd}
                          onTouchMove={handleTouchEnd}
                          onMouseDown={() => (isMine || isAdmin) && handleMouseDown(message)}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        >
                          {message.image && (
                            <img
                              src={message.image}
                              alt="Attached"
                              className="rounded-lg max-w-[200px] sm:max-w-[300px] mb-2"
                            />
                          )}
                          {message.text && (
                            <p className="break-words text-sm sm:text-base">
                              {renderMessageText(message.text, isMine)}
                            </p>
                          )}
                          <div className={`flex items-center gap-2 mt-1 text-xs ${
                            isMine ? "text-white/70" : "text-gray-500"
                          }`}>
                            <span>{formatTime(message.createdAt)}</span>
                            {message.edited && <span className="italic">(edited)</span>}
                          </div>
                        </div>
                      )}

                      {/* Edit and Delete buttons - show for sender, delete for admins */}
                      {hoveredMessage === message._id && editingMessage !== message._id && (
                        <div className={`absolute top-0 ${
                          isMine ? "left-0 -translate-x-16" : "right-0 translate-x-16"
                        } flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {isMine && message.text && (
                            <button
                              onClick={() => handleStartEdit(message)}
                              className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                              title="Edit message"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {(isMine || isAdmin) && (
                            <button
                              onClick={() => handleDeleteMessage(message._id)}
                              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Delete message"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu Modal for Mobile */}
      {contextMenu && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setContextMenu(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-2 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.sender === authUser?._id && contextMenu.text && (
              <button
                onClick={() => handleStartEdit(contextMenu)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-left"
              >
                <Edit2 className="w-5 h-5 text-blue-500" />
                <span className="text-gray-800 font-medium">Edit Message</span>
              </button>
            )}
            {((typeof contextMenu.sender === 'string' ? contextMenu.sender : contextMenu.sender?._id) === authUser?._id || isAdmin) && (
              <button
                onClick={() => handleDeleteMessage(contextMenu._id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-left"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="text-gray-800 font-medium">Delete Message</span>
              </button>
            )}
            <button
              onClick={() => setContextMenu(null)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-600 border-t mt-1 pt-3"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Add Members</h3>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUsersToAdd([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {users?.filter(user => 
                !selectedGroup?.members?.some(member => 
                  (typeof member === 'string' ? member : member._id) === user._id
                )
              ).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>All users are already members</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users
                    ?.filter(user => 
                      !selectedGroup?.members?.some(member => 
                        (typeof member === 'string' ? member : member._id) === user._id
                      )
                    )
                    .map(user => (
                      <div
                        key={user._id}
                        onClick={() => toggleUserSelection(user._id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                          selectedUsersToAdd.includes(user._id)
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsersToAdd.includes(user._id)}
                          onChange={() => {}}
                          className="w-5 h-5 text-blue-500 rounded"
                        />
                        {user.profilePicture && (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{user.username}</p>
                          {user.email && (
                            <p className="text-xs text-gray-500">{user.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUsersToAdd([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembers}
                disabled={selectedUsersToAdd.length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add {selectedUsersToAdd.length > 0 && `(${selectedUsersToAdd.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
};

export default GroupChatContainer;
