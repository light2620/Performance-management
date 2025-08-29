// Spinner.jsx
import React from "react";
import "./style.css"
const Spinner = ({ size = 20 }) => {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size }}
    ></div>
  );
};

export default Spinner;
