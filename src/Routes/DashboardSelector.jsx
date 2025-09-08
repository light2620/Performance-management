import React from 'react'
import { useAuth } from '../Utils/AuthContext'
import Home from '../Pages/Dashboard/Home';
import AdminDashbaord from '../Pages/AdminDashboard/AdminDashbaord';

const DashboardSelector = () => {
    const { user } = useAuth();
    if(!user) {
        return null; // or a loading spinner, or redirect to login
    }
    const isAdmin = user?.role === "ADMIN";
    if (isAdmin) {
        return <AdminDashbaord />;
    } else {
        return <Home />;
    }
    
}

export default DashboardSelector
