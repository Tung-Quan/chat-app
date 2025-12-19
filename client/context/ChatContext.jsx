import { useState, useEffect, useCallback } from "react";
import { getAllUsers, getMessages, sendMessage as sendMessageApi, deleteMessage as deleteMessageApi, editMessage as editMessageApi, deleteUser as deleteUserApi } from "../src/lib/api";
import { useAuth } from "../src/hooks/useAuth";
import toast from "react-hot-toast";
import { ChatContext } from "./ContextValues";

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

  // Delete user
  const deleteUserAccount = useCallback(async (userId) => {
    try {
      const data = await deleteUserApi(userId);
      if (data.success) {
        toast.success("Account deleted successfully");
        // Clear localStorage and redirect to login
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      } else {
        toast.error(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
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

  // Edit message
  const editMessage = useCallback(async (messageId, newText) => {
    try {
      const data = await editMessageApi(messageId, newText);
      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId ? data.message : msg
        ));
        toast.success("Message updated");
        return data.message;
      }
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message");
      throw error;
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

    socket.on("messageEdited", (editedMessage) => {
      // Update edited message in list
      setMessages(prev => prev.map(msg => 
        msg._id === editedMessage._id ? editedMessage : msg
      ));
    });

    socket.on("newUser", (newUser) => {
      // Add new user to users list
      setUsers(prev => {
        // Check if user already exists
        if (prev.some(u => u._id === newUser._id)) {
          return prev;
        }
        return [...prev, newUser];
      });
    });

    socket.on("userDeleted", ({ userId }) => {
      // Remove deleted user from list
      setUsers(prev => prev.filter(u => u._id !== userId));
      // If deleted user was selected, deselect
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
        setMessages([]);
      }
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("messageEdited");
      socket.off("newUser");
      socket.off("userDeleted");
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
    editMessage,
    unSeenMessages,
    fetchUsers,
    deleteUserAccount
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
