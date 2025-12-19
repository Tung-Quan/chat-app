import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import MessageInput from "./MessageInput";
import UserProfileModal from "./UserProfileModal";
import { useEffect, useRef, useState } from "react";
import { Edit2, Trash2, X } from "lucide-react";

const ChatContainer = () => {
  const { selectedUser, messages, loading, deleteMessage, editMessage } = useChat();
  const { authUser, onlineUsers } = useAuth();
  const messagesEndRef = useRef(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimer = useRef(null);

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

  const isOnline = onlineUsers.includes(selectedUser?._id);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {showProfileModal && (
        <UserProfileModal 
          userId={selectedUser._id} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
      
      {/* Chat Header */}
      <div className="p-4 pl-16 md:pl-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div 
            className="relative cursor-pointer hover:opacity-80 transition"
            onClick={() => setShowProfileModal(true)}
            title="View profile"
          >
            <img
              src={selectedUser?.profilePicture}
              alt={selectedUser?.username}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white"
            />
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div 
            className="cursor-pointer hover:opacity-80 transition"
            onClick={() => setShowProfileModal(true)}
          >
            <h2 className="font-semibold text-white text-base sm:text-lg">{selectedUser?.username}</h2>
            <p className="text-xs sm:text-sm text-white/80">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = (typeof message.sender === 'string' ? message.sender : message.sender?._id) === authUser?._id;
            return (
              <div
                key={message._id}
                className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
                onMouseEnter={() => setHoveredMessage(message._id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                <div className="relative max-w-[85%] sm:max-w-[70%]">
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
                      } rounded-2xl p-2.5 sm:p-3 shadow-md`}
                      onTouchStart={() => isMine && handleTouchStart(message)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}
                      onMouseDown={() => isMine && handleMouseDown(message)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="rounded-lg mb-2 w-full max-w-[300px] h-auto"
                        />
                      )}
                      {message.text && <p className="break-words whitespace-pre-wrap">{message.text}</p>}
                      <p
                        className={`text-xs mt-1 ${
                          isMine ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {formatTime(message.createdAt)}
                        {message.edited && <span className="italic ml-2">(edited)</span>}
                      </p>
                    </div>
                  )}
                  {isMine && hoveredMessage === message._id && editingMessage !== message._id && (
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {message.text && (
                        <button
                          onClick={() => handleStartEdit(message)}
                          className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                          title="Edit message"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="Delete message"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
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
            {contextMenu.text && (
              <button
                onClick={() => handleStartEdit(contextMenu)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-left"
              >
                <Edit2 className="w-5 h-5 text-blue-500" />
                <span className="text-gray-800 font-medium">Edit Message</span>
              </button>
            )}
            <button
              onClick={() => handleDeleteMessage(contextMenu._id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-left"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-gray-800 font-medium">Delete Message</span>
            </button>
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

      {/* Message Input */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        <MessageInput />
      </div>
    </div>
  );
};

export default ChatContainer;
