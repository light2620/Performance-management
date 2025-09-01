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
import UserManagement from "../Pages/UserManagement/UserManagement";
import ManageDepartment from "../Pages/ManageDepartment/ManageDepartment";
import Requests from "../Pages/Requests/Requests";
import Entries from "../Pages/Entries/Entries";



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
         {path: "/requests",element: <Requests />},
         {path: "/points-entries",element: <Entries/>},
      {path: "/settings",element: <Setting />},
      {path: "/settings/manage-user",element: <UserManagement />},
      {path: "/settings/manage-department",element: <ManageDepartment />}
 
   
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
