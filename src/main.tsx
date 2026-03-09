import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme on startup
const savedTheme = localStorage.getItem('theme') || 'dark';
const root = document.documentElement;
if (savedTheme === 'light') {
  root.classList.add('light');
  root.classList.remove('dark');
} else if (savedTheme === 'dark') {
  root.classList.remove('light');
  root.classList.add('dark');
} else {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) { root.classList.add('dark'); root.classList.remove('light'); }
  else { root.classList.add('light'); root.classList.remove('dark'); }
}

createRoot(document.getElementById("root")!).render(<App />);
