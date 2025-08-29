import { Navigate } from "react-router-dom";
import { useAuth } from "../Utils/AuthContext";
const GuestRoute = ({ children }) => {
  const {isLoggedIn} = useAuth();
  if (isLoggedIn) return <Navigate to="/" replace />;
  return children;
};

export default GuestRoute;
