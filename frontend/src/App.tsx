import './App.scss'
import 'react-toastify/dist/ReactToastify.css';
import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider} from "react-router-dom";
import Home from "./pages/Home/Home.tsx";
import {useTheme} from "./hooks/use-theme.ts";
import Signup from "./pages/Signup/Signup.tsx";
import {ToastContainer} from 'react-toastify';
import Signin from "./pages/Signin/Signin.tsx";
import SignupConfirm from "./pages/SignupConfirm/SignupConfirm.tsx";
import ForgetPassword from "./pages/ForgetPassword/ForgetPassword.tsx";
import ResetPassword from "./pages/ResetPassword/ResetPassword.tsx";
import PrivateRoute from "./services/PrivateRoute.tsx";
import PublicRoute from "./services/PublicRoute.tsx";
import EventDetail from "./pages/EventDetail/EventDetail.tsx";
import Profile from "./pages/Profile/Profile.tsx";
import UserTickets from "./pages/UserTickets/UserTickets.tsx";
import AddEvent from "./pages/AddEvent/AddEvent.tsx";
import Statistics from "./pages/Statistics/Statistics.tsx";

const router = createBrowserRouter(createRoutesFromElements(
        <Route path="/">
            <Route element={<PrivateRoute />}>
                <Route index element={<Home/>}/>
                <Route path='events/:eventId' element={<EventDetail />}/>
                <Route path='profile' element={<Profile />}/>
                <Route path='user_tickets' element={<UserTickets />}/>

                <Route path="/admin/">
                    <Route path='create_event' element={<AddEvent />}/>
                    <Route path='statistics' element={<Statistics />}/>
                </Route>

            </Route>

            <Route element={<PublicRoute restricted />}>
                <Route path="signup" element={<Signup/>}/>
                <Route path="signin" element={<Signin />} />
                <Route path="/auth/registration_confirm/:verificationToken" element={<SignupConfirm />} />
                <Route path="auth/reset_password/:resetPasswordToken" element={<ResetPassword />} />
                <Route path='forget-password' element={<ForgetPassword/>} />
            </Route>


            {/*<Route path="*" element={<h1>Page not found</h1>} />*/}
        </Route>
    )
);

function App() {
    // @ts-ignore
    const {theme, setTheme} = useTheme();

    return (
        <>
            <RouterProvider router={router}/>
            <ToastContainer/>
        </>
    )
}

export default App
