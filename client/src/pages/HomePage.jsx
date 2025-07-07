import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import Spline from '@splinetool/react-spline';

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
    navigate("/"); // Navigate to login page
  };

  return (
    <div className="relative h-screen bg-[#0d1117] overflow-hidden">
      {/* Spline 3D Background */}
      <Spline
        scene="https://prod.spline.design/vFLhCVTJbARFzWqG/scene.splinecode"
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* Top Right Buttons */}
      <div className="absolute top-6 right-6 z-10 flex gap-4">
        <button
          onClick={() => navigate("/chat")}
          className="px-5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-full text-sm shadow"
        >
          Go to Chat
        </button>
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-[#da3633] hover:bg-red-700 text-white rounded-full text-sm shadow"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
