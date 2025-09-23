import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./Routes/routs";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="App">
      <RouterProvider router={router} />
      <Toaster />
    </div>
  );
}

export default App;
