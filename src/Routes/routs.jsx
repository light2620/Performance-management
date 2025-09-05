import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "../Layout/AuthLayout/AuthLayout";
import MainLayout from "../Layout/MainLayout/MainLayout";
import Login from "../Pages/Auth/Login/Login";
import Home from "../Pages/Dashboard/Home";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import Setting from "../Pages/Setting/Setting";
import UserManagement from "../Pages/UserManagement/UserManagement";
import ManageDepartment from "../Pages/ManageDepartment/ManageDepartment";
import Requests from "../Pages/Requests/Requests";
import Entries from "../Pages/Entries/Entries";
import AllPoints from "../Pages/All Points/AllPoints";
import AdminRoute from "./AdmiRoute";
import AuditLogs from "../Pages/AuditLogs/AuditLogs";
import Notifications from "../Pages/Notifications/Notification";
import SingleRequestPage from "../Pages/SingleRequestPage/SingleRequestPage";
import SingleEntryPage from "../Pages/SingleEntryPage/SingleEntryPage";



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
         {path: "/requests/:id",element: <SingleRequestPage />},
         {path: "/points-entries",element: <Entries/>},
         {path: "/points-entries/:id",element: <SingleEntryPage/>},
         {path: "/audit-log",element: <AuditLogs/>},
         {path: "/notifications",element: <Notifications/>},
      {path: "/settings/manage-user",element: <AdminRoute><UserManagement /> </AdminRoute> },
      {path: "/settings/manage-department",element: <AdminRoute><ManageDepartment /> </AdminRoute>},
      {path: "/points-summary",element: <AdminRoute><AllPoints /></AdminRoute>},
      
 
   
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
