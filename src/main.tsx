import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AnimationTimeline } from "./components/AnimationTimeline";
import "./index.css";

const isAnimationStudio = new URLSearchParams(window.location.search).get("studio") === "animation";

createRoot(document.getElementById("root")!).render(
  isAnimationStudio ? (
    <AnimationTimeline />
  ) : (
    <>
      <App />
      <a
        href="?studio=animation"
        className="fixed bottom-5 left-5 z-[60] rounded-xl border border-purple-400/30 bg-[#17112b]/95 px-3 py-2 text-xs font-semibold text-purple-200 shadow-2xl shadow-purple-950/40 backdrop-blur-md transition hover:border-purple-300/50 hover:bg-[#21183d]"
      >
        ✦ Animation Studio
      </a>
    </>
  )
);
