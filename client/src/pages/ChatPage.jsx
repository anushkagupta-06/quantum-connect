import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

export default function ChatPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem("token");

  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef();

  const socketRef = useRef();
  const selectedUserRef = useRef(null);

  // Socket setup and user fetch
  useEffect(() => {
    const socket = io("http://localhost:5050");
    socketRef.current = socket;

    socket.on("connect", async () => {
      try {
        const meRes = await axios.get("http://localhost:5050/api/chat/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(meRes.data);
        socket.emit("join", meRes.data._id);

        const usersRes = await axios.get("http://localhost:5050/api/chat/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(usersRes.data);

        socket.on("update-user-status", (onlineUserIds) => {          // update the online-users map
            setOnlineUsers(onlineUserIds);
          });

      } catch (err) {
        toast.error("Failed to load chat data");
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      axios.get(`http://localhost:5050/api/chat/messages/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setMessages(res.data)).catch(console.error);
    }
  }, [selectedUser]);

  // On the receiver side, when the chat is open, emit "message-read"
  // Finds all messages sent to you that are not read and emits them as message-read
  useEffect(() => {
    if (selectedUser && currentUser && messages.length > 0) {
      const unread = messages
        .filter(m => m.receiver === currentUser._id && m.status !== 'read')
        .map(m => m._id);
  
      if (unread.length > 0) {
        socketRef.current.emit("message-read", {
          messageIds: unread,
          senderId: selectedUser._id
        });
      }
    }
  }, [messages, selectedUser]);

  // Socket listeners
  useEffect(() => {
    const handleMessage = (data) => {
      const currentSelectedUser = selectedUserRef.current;
      const senderId = data.sender?._id || data.sender;
      const receiverId = data.receiver?._id || data.receiver;
  
      // Always emit delivered if current user is ready
      if (currentUser) {
        socketRef.current.emit("message-delivered", {
          messageId: data._id,
          receiverId: currentUser._id,
          senderId
        });
      }
      // Only show message in UI if it belongs to current open chat
      if (
        currentSelectedUser &&
        (senderId === currentSelectedUser._id || receiverId === currentSelectedUser._id)
      ) {
        setMessages(prev => [...prev, data]);
      }
    };
    const handleStatusUpdate = ({ messageId, messageIds, status }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            const id = msg._id?.toString();
            if ((messageId && id === messageId) || (messageIds && messageIds.includes(id))) {
              return { ...msg, status };
            }
            return msg;
          })
        );
      };
    if (socketRef.current) {
      socketRef.current.on("receive-message", handleMessage);
      socketRef.current.on("message-status-updated", handleStatusUpdate);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off("receive-message", handleMessage);
        socketRef.current.off("message-status-updated", handleStatusUpdate);
      }
    };
  }, [currentUser]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    socketRef.current.emit("typing", { receiverId: selectedUser._id });
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socketRef.current.emit("stop-typing", { receiverId: selectedUser._id });
    }, 2500);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    try {
      const res = await axios.post("http://localhost:5050/api/chat/message", {
        receiverId: selectedUser._id,
        text: newMessage.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const msgToSend = {
        ...res.data,
        sender: currentUser._id,
        receiver: selectedUser._id,
        status: 'sent',
        _id: res.data._id, 

      };

      setMessages(prev => [...prev, msgToSend]);

      socketRef.current.emit("send-message", {
        receiverId: selectedUser._id,
        message: msgToSend
      });
      setShowEmojiPicker(false);
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // to close emoji-picker pop-up on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // image upload setup
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // for preview
    }
  };

  const sendImageMessage = async () => {
    if (!imageFile || !selectedUser || !currentUser) return;
    setIsUploadingImage(true);         // start loading while image upload
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      const res = await axios.post('http://localhost:5050/api/chat/upload-image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const imageUrl = res.data.url;
      // Now send this URL as a message
      const msgRes = await axios.post('http://localhost:5050/api/chat/message', {
        receiverId: selectedUser._id,
        text: imageUrl, // image URL as message text
        isImage: true,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const msgToSend = {
        ...msgRes.data,
        sender: currentUser._id,
        receiver: selectedUser._id,
        status: 'sent',
      };
      setMessages(prev => [...prev, msgToSend]);
      socketRef.current.emit("send-message", {
        receiverId: selectedUser._id,
        message: msgToSend
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Failed to upload image", err);
      toast.error("Image upload failed");
    }finally {
        setIsUploadingImage(false); // Stop loading
      }
  };   

  

  return (
    <div className="flex h-screen font-sans bg-[#0d1117] text-white">
      {/* Sidebar */}
      <div className="w-72 p-6 border-r border-gray-800 bg-[#161b22]">
        <h2 className="text-2xl font-bold mb-6 text-[#58a6ff]">Quantum Connect</h2>
        <ul className="space-y-2 overflow-y-auto max-h-[85vh] custom-scrollbar">
          {users.map(user => {
            const isOnline = onlineUsers.includes(user._id);
            return (
            <li
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`px-4 py-2 rounded-xl cursor-pointer font-medium transition duration-200 whitespace-nowrap overflow-hidden text-ellipsis ${
                selectedUser?._id === user._id
                  ? 'bg-[#1f6feb] text-white'
                  : 'hover:bg-[#21262d] hover:text-[#58a6ff]'}
              `} >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                {user.username}
                </div>
            </li>
            );
        })}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {selectedUser && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161b22]">
            <h3 className="text-xl font-semibold text-white">{selectedUser.username}</h3>
            {isTyping && typingUser?.toString() === selectedUser._id?.toString() && (
                <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-[#58a6ff] animate-pulse">Typing</span>
                <div className="flex space-x-1">
                <span className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                <span className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                <span className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                </div>
            </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 px-6 pt-4 pb-2 custom-scrollbar">
          {selectedUser ? (
            <>
              {messages.map((msg, index) => {
                const isSender = msg.sender === currentUser?._id || msg.sender?._id === currentUser?._id;
                const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                <div key={index} className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                    <div
                        className={`max-w-[70%] px-4 py-3 rounded-xl text-sm shadow-md break-words ${
                        isSender
                        ? 'bg-[#238636] text-white'
                        : 'bg-[#21262d] text-white border border-[#30363d]'
                        }`}
                    >
                    {msg.isImage ? (
                        <a href={msg.text} target="_blank" rel="noopener noreferrer">
                        <img
                        src={msg.text}
                        alt="sent"
                        className="max-w-xs rounded-lg shadow-md"
                        onError={(e) => e.target.style.display = 'none'}
                        />
                        </a>
                        ) : (
                            msg.text
                        )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <span>{time}</span>
                        {isSender && (
                        <span className="italic">
                        {msg.status === 'read' ? '✓✓ Read' : msg.status === 'delivered' ? '✓✓ Delivered' : '✓ Sent'}
                        </span>
                        )}
                    </div>
                </div>
                );
                })}

                <div ref={messagesEndRef}></div>
            </>
          ) : (
            <div className="text-center mt-32 text-gray-400 text-lg">
              Select a user to start chatting
            </div>
          )}
        </div>

        {/* Input */}
        {selectedUser && (
          <div className="px-6 py-4 border-t border-gray-800 flex items-center space-x-4 bg-[#0d1117]">
            {/* Emoji Button */}
            <button
                onClick={() => setShowEmojiPicker(prev => !prev)}        // onClick: Toggles the visibility of the emoji picker using state showEmojiPicker
                className="text-white text-2xl"
            >
                😊
            </button>
            {/* Emoji Picker Popup */} 
            {showEmojiPicker && (         // Renders the picker only when showEmojiPicker is true
                <div ref={emojiPickerRef} className="absolute bottom-20 left-6 z-50">
                <EmojiPicker          // Component from the emoji-picker-react library
                onEmojiClick={(emojiData) => {
                setNewMessage(prev => prev + emojiData.emoji);
            }}
            theme="dark"
            />
          </div>
        )}

            {/* Input */}
            <input
              type="text"
              value={newMessage}
              onChange={e => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-full bg-[#0d1117] text-white placeholder-gray-500 border border-[#30363d] focus:ring-2 focus:ring-[#58a6ff] outline-none"
            />

            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="imageUpload" />
            <label htmlFor="imageUpload" className="cursor-pointer text-2xl">📷</label>

            {imagePreview && (
                <>
                <div className="relative">
                    <img src={imagePreview} alt="preview" className="w-32 h-32 object-cover rounded-xl mt-2" />
                <button onClick={() => setImagePreview(null)} className="absolute top-1 right-1 bg-red-500 text-white text-sm px-2 py-1 rounded-full">✕</button>
                <button onClick={sendImageMessage} className="bg-[#238636] text-white px-4 py-2 rounded-full mt-2" disabled={isUploadingImage}>
                    {isUploadingImage ? "Sending..." : "Send Image"}
                </button>
                </div>
                {isUploadingImage && (
                    <div className="text-sm text-gray-400 mt-2 animate-pulse">Uploading image...</div>
                  )}
                </> 
            )}
            <button
              onClick={sendMessage}
              className="bg-[#238636] hover:bg-[#2ea043] transition px-6 py-3 rounded-full font-semibold text-white shadow-md"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
