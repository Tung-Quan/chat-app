import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import { useChat } from "../hooks/useChat";
import { useGroup } from "../hooks/useGroup";

const Home = () => {
  const { selectedUser, setSelectedUser } = useChat();
  const { selectedGroup, setSelectedGroup } = useGroup();

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const isAnythingSelected = selectedUser || selectedGroup;

  return (
    <div className="h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-2 sm:p-4">
      <div className="h-full max-w-7xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex relative">
        {/* Mobile Back Button */}
        {isAnythingSelected && (
          <button
            onClick={() => {
              setSelectedUser(null);
              setSelectedGroup(null);
            }}
            className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-full shadow-lg"
          >
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Sidebar - Hidden on mobile when user/group selected */}
        <div className={`${isAnythingSelected ? 'hidden md:flex' : 'flex'} w-full md:w-80`}>
          <Sidebar onSelectUser={handleSelectUser} />
        </div>

        {/* Chat Container - Full width on mobile */}
        {selectedUser ? (
          <div className="flex-1 w-full">
            <ChatContainer />
          </div>
        ) : selectedGroup ? (
          <div className="flex-1 w-full">
            <GroupChatContainer />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
                Welcome to Chat App
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
