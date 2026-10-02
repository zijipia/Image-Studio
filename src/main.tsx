import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AnimationTimeline } from "./components/AnimationTimeline";
import "./index.css";

const isAnimationStudio = new URLSearchParams(window.location.search).get("studio") === "animation";

createRoot(document.getElementById("root")!).render(
  isAnimationStudio ? <AnimationTimeline /> : <App />
);
