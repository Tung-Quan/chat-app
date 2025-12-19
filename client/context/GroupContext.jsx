import { createContext, useState, useEffect } from "react";
import { useAuth } from "../src/hooks/useAuth";
import {
  getGroups,
  getGroupMessages,
  sendGroupMessage,
  createGroup as apiCreateGroup,
  addGroupMember,
  removeGroupMember,
  deleteGroupMessage as apiDeleteGroupMessage,
  editGroupMessage as apiEditGroupMessage,
  updateGroup as apiUpdateGroup,
  deleteGroup as apiDeleteGroup
} from "../src/lib/api";
import toast from "react-hot-toast";

export const GroupContext = createContext(null);

export const GroupProvider = ({ children }) => {
  const { socket } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await getGroups();
      setGroups(response.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected group
  const fetchGroupMessages = async (groupId) => {
    try {
      setLoading(true);
      const response = await getGroupMessages(groupId);
      setGroupMessages(response.messages || []);
    } catch (error) {
      console.error("Error fetching group messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Send message to group
  const sendMessage = async (text, image) => {
    if (!selectedGroup) return;
    
    try {
      const response = await sendGroupMessage(selectedGroup._id, { text, image });
      // Message will be added via socket event
      if (response.success) {
        return response.message;
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending group message:", error);
      toast.error("Failed to send message");
    }
  };

  // Create new group
  const createGroup = async (name, description, avatar, memberIds) => {
    try {
      const response = await apiCreateGroup({ 
        name, 
        description, 
        avatar, 
        memberIds 
      });
      toast.success("Group created successfully");
      return response.group;
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
      throw error;
    }
  };

  // Add member to group
  const addMember = async (groupId, userId) => {
    try {
      await addGroupMember(groupId, userId);
      toast.success("Member added successfully");
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

  // Remove member from group
  const removeMember = async (groupId, userId) => {
    try {
      await removeGroupMember(groupId, userId);
      toast.success("Member removed successfully");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  // Delete group message
  const deleteMessage = async (messageId) => {
    try {
      await apiDeleteGroupMessage(messageId);
      // Message will be removed via socket event
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Edit group message
  const editMessage = async (messageId, newText) => {
    try {
      const response = await apiEditGroupMessage(messageId, newText);
      // Message will be updated via socket event
      return response.message;
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message");
      throw error;
    }
  };

  // Update group information
  const updateGroupInfo = async (groupId, groupData) => {
    try {
      const response = await apiUpdateGroup(groupId, groupData);
      toast.success("Group updated successfully");
      return response.group;
    } catch (error) {
      console.error("Error updating group:", error);
      toast.error("Failed to update group");
      throw error;
    }
  };

  // Delete group
  const deleteGroupFunc = async (groupId) => {
    try {
      await apiDeleteGroup(groupId);
      toast.success("Group deleted successfully");
      setSelectedGroup(null);
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
      throw error;
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // New group created
    socket.on("newGroup", (group) => {
      setGroups(prev => [group, ...prev]);
      toast.success(`Added to group: ${group.name}`);
    });

    // New message in group
    socket.on("newGroupMessage", ({ groupId, message }) => {
      if (selectedGroup?._id === groupId) {
        setGroupMessages(prev => [...prev, message]);
      }
      
      // Update last message in groups list
      setGroups(prev => prev.map(g => 
        g._id === groupId 
          ? { ...g, lastMessage: message, updatedAt: message.createdAt }
          : g
      ));
    });

    // Message deleted
    socket.on("groupMessageDeleted", ({ groupId, messageId }) => {
      if (selectedGroup?._id === groupId) {
        setGroupMessages(prev => prev.filter(m => m._id !== messageId));
      }
    });

    // Message edited
    socket.on("groupMessageEdited", ({ groupId, message }) => {
      if (selectedGroup?._id === groupId) {
        setGroupMessages(prev => prev.map(m => 
          m._id === message._id ? message : m
        ));
      }
    });

    // Group updated
    socket.on("groupUpdated", (updatedGroup) => {
      setGroups(prev => prev.map(g => 
        g._id === updatedGroup._id ? updatedGroup : g
      ));
      if (selectedGroup?._id === updatedGroup._id) {
        setSelectedGroup(updatedGroup);
      }
    });

    // Group deleted
    socket.on("groupDeleted", ({ groupId }) => {
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
        setGroupMessages([]);
      }
      toast.info("A group was deleted");
    });

    // Added to group
    socket.on("addedToGroup", (group) => {
      setGroups(prev => [group, ...prev]);
      toast.success(`Added to group: ${group.name}`);
    });

    // Removed from group
    socket.on("removedFromGroup", ({ groupId }) => {
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
        setGroupMessages([]);
      }
      toast.info("You were removed from a group");
    });

    // Member added
    socket.on("memberAdded", ({ groupId, newMember }) => {
      setGroups(prev => prev.map(g => 
        g._id === groupId 
          ? { ...g, members: [...g.members, newMember] }
          : g
      ));
    });

    // Member removed
    socket.on("memberRemoved", ({ groupId, removedMemberId }) => {
      setGroups(prev => prev.map(g => 
        g._id === groupId 
          ? { ...g, members: g.members.filter(m => m._id !== removedMemberId) }
          : g
      ));
    });

    return () => {
      socket.off("newGroup");
      socket.off("newGroupMessage");
      socket.off("groupMessageDeleted");
      socket.off("groupMessageEdited");
      socket.off("groupUpdated");
      socket.off("groupDeleted");
      socket.off("addedToGroup");
      socket.off("removedFromGroup");
      socket.off("memberAdded");
      socket.off("memberRemoved");
    };
  }, [socket, selectedGroup]);

  // Fetch messages when group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMessages(selectedGroup._id);
    } else {
      setGroupMessages([]);
    }
  }, [selectedGroup]);

  return (
    <GroupContext.Provider
      value={{
        groups,
        selectedGroup,
        setSelectedGroup,
        groupMessages,
        loading,
        fetchGroups,
        sendMessage,
        createGroup,
        addMember,
        removeMember,
        deleteMessage,
        editMessage,
        updateGroupInfo,
        deleteGroup: deleteGroupFunc,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};
