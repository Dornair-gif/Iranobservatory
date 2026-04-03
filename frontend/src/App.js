import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Header } from "./components/Header";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import Article from "./pages/Article";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

function AppContent() {
  return (
    <div className="App min-h-screen bg-white">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <>
            <Header />
            <Admin />
          </>
        } />
        <Route path="/article/:id" element={
          <>
            <Header />
            <Article />
          </>
        } />
        <Route path="/" element={
          <>
            <Header />
            <Home />
          </>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
          <Toaster position="top-right" />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
