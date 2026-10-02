import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import ScrollToTop from "./components/ScrollToTop";
import AppLayout from "@/components/layout/AppLayout";
import WeeklyTracker from "@/pages/WeeklyTracker";

const Stats = lazy(() => import("@/pages/Stats"));
const Settings = lazy(() => import("@/pages/Settings"));

function SystemDarkMode() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return null;
}

function RouteFallback() {
  return <div className="min-h-[60vh]" aria-busy="true" />;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <SystemDarkMode />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<WeeklyTracker />} />
          <Route path="/stats" element={<Suspense fallback={<RouteFallback />}><Stats /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<RouteFallback />}><Settings /></Suspense>} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}
