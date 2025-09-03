import React from "react";
import { useTheme } from "../ThemeContext";
import "./style.css"; // we'll style the toggle

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <label className="theme-switch">
      <input
        type="checkbox"
        checked={theme === "dark"}
        onChange={toggleTheme}
      />
      <span className="slider">
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
    </label>
  );
};

export default ThemeToggle;
