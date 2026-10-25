import { Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import LaunchesPage from "@/pages/LaunchesPage";
import AppDetailPage from "@/pages/AppDetailPage";
import SettingsPage from "@/pages/SettingsPage";
import WelcomePage from "@/pages/WelcomePage";
import "./App.css";

export default function App() {
  return (
    <Routes>
      {/* Apple-style cover landing */}
      <Route path="/" element={<Landing />} />

      {/* IDE workspace */}
      <Route path="/app" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="welcome" element={<WelcomePage />} />
        <Route path="launches" element={<LaunchesPage />} />
        <Route path="apps/:id" element={<AppDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
