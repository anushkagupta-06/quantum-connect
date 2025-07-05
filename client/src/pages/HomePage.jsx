import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';

export default function HomePage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "User");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    toast.success('Logout successful');
    navigate("/"); // redirect to login
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {username} 🚀
      </h1>
      <div className="flex space-x-4">
        <button
          onClick={() => navigate("/chat")}
          className="px-6 py-3 bg-primary text-black rounded hover:brightness-110 transition"
        >
          Go to Chat
        </button>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}