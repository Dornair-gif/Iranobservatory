import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Header } from "./components/Header";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import Article from "./pages/Article";
import Articles from "./pages/Articles";
import Studies from "./pages/Studies";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import IndexPreview from "./pages/IndexPreview";
import Dashboard from "./pages/Dashboard";

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
        <Route path="/articles" element={
          <>
            <Header />
            <Articles />
          </>
        } />
        <Route path="/studies" element={
          <>
            <Header />
            <Studies />
          </>
        } />
        <Route path="/preview-index" element={<IndexPreview />} />
        <Route path="/monitor" element={<Dashboard />} />
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
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
            <Toaster position="top-right" />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
