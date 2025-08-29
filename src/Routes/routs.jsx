import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "../Layout/AuthLayout/AuthLayout";
import MainLayout from "../Layout/MainLayout/MainLayout";
import Login from "../Pages/Auth/Login/Login";
import Home from "../Pages/Dashboard/Home";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import AdminRoute from "./AdmiRoute";
import Setting from "../Pages/Setting/Setting";
import Createuser from "../Pages/Createuser/Createuser";



const router = createBrowserRouter([
  // Protected app (logged-in)
  {
    path: "/", // important!
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // when user hits "/", push them to /dashboard
      { index: true, element: <Home />},
      { path: "/home", element: <Home /> },
      {path: "/settings",element: <Setting />},
      {path : "/settings/create-user", element: <Createuser />},
      // add more private routes here
    ],
  },

  // Auth pages (logged-out only)
  {
    path: "/auth",
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    children: [
      { path: "login", element: <Login /> },
      // add more public routes here
  //       {
  //   path: "create-user",
  //   element:       <ProtectedRoute>
  //       <AuthLayout />
  //     </ProtectedRoute>,
  //     children : [
  //       {
  //         index: true,
  //         element : <AdminRoute>
  //           <CreateUser />
  //         </AdminRoute>
  //       }
  //     ]
  // }
 
    ],
  },

  // {
  //   path: "create-user",
  //   element : <ProtectedRoute>
  //       <AuthLayout />
  //   </ProtectedRoute>,
  //   children : [
  //     {
  //       index : true,
  //       element :<AdminRoute> <CreateUser /> </AdminRoute>
  //     }
  //   ]

  // }

  // Catch-all
  // {
  //   path: "*",
  //   element: (
  //     <Navigate to={isAuthenticated ? "/" : "/auth/login"} replace />
  //   ),
  // },
]);

export default router;
