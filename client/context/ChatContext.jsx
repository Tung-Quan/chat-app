import { createContext, useState, useEffect, useCallback } from "react";
import { getAllUsers, getMessages, sendMessage as sendMessageApi, deleteMessage as deleteMessageApi } from "../src/lib/api";
import { useAuth } from "../src/hooks/useAuth";
import toast from "react-hot-toast";

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { socket } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unSeenMessages, setUnSeenMessages] = useState({});

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      if (data.success) {
        setUsers(data.users);
        setUnSeenMessages(data.unSeenMessages || {});
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  }, []);

  // Fetch messages for selected user
  const fetchMessages = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getMessages(userId);
      if (data.success) {
        setMessages(data.messages);
        // Clear unseen messages for this user
        setUnSeenMessages(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (text, image = null) => {
    if (!selectedUser) return;
    try {
      const data = await sendMessageApi(selectedUser._id, { text, image });
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  }, [selectedUser]);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      const data = await deleteMessageApi(messageId);
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        toast.success("Message deleted");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  }, []);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (message) => {
      // If message is from selected user, add to messages
      if (selectedUser && message.sender === selectedUser._id) {
        setMessages(prev => [...prev, message]);
      } else {
        // Update unseen messages count
        setUnSeenMessages(prev => ({
          ...prev,
          [message.sender]: (prev[message.sender] || 0) + 1
        }));
        toast.success("New message received");
      }
    });

    socket.on("messageDeleted", (messageId) => {
      // Remove deleted message from list
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageDeleted");
    };
  }, [socket, selectedUser]);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
    } else {
      setMessages([]);
    }
  }, [selectedUser, fetchMessages]);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const value = {
    users,
    selectedUser,
    setSelectedUser,
    messages,
    loading,
    sendMessage,
    deleteMessage,
    unSeenMessages,
    fetchUsers
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
