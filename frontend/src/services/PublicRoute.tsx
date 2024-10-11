import { Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";

const PublicRoute = ({ restricted = false }) => {
    const token = Cookies.get('token');
    const shouldRedirect = token && restricted;

    return shouldRedirect ? (
        <Navigate to="/" replace={true} />
    ) : (
        <Outlet />
    );
};

export default PublicRoute;