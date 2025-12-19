import { useState } from "react";
import { useChat } from "../hooks/useChat";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const { sendMessage } = useChat();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSending) return; // Prevent duplicate submissions
    
    if (!text.trim() && !image) {
      toast.error("Please enter a message or select an image");
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(text, image);
      setText("");
      setImage(null);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      {image && (
        <div className="mb-2 relative inline-block">
          <img src={image} alt="Preview" className="h-20 rounded-lg" />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
          >
            ×
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-2 sm:p-4 flex items-center space-x-2">
        <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </label>
        
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        />
        
        <button
          type="submit"
          disabled={isSending}
          className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:shadow-lg transform hover:scale-105 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex-shrink-0"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
