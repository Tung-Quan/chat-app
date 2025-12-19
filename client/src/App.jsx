import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { ChatProvider } from '../context/ChatContext'
import { GroupProvider } from '../context/GroupContext'

// Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Profile from './pages/Profile'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { authUser } = useAuth();
  return authUser ? (
    <ChatProvider>
      <GroupProvider>
        {children}
      </GroupProvider>
    </ChatProvider>
  ) : <Navigate to="/login" />;
};

const App = () => {
  const { authUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-center" />
      <Routes>
        <Route 
          path="/login" 
          element={authUser ? <Navigate to="/" /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={authUser ? <Navigate to="/" /> : <Signup />} 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  )
}

export default App  