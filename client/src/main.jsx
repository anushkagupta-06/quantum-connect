import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import AuthPage from './pages/AuthPage'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import { Toaster } from 'react-hot-toast'
import ChatPage from './pages/ChatPage'
import Settings from './pages/Settings'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)