import './App.scss';
import 'react-toastify/dist/ReactToastify.css';
import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
    RouterProvider,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { ToastContainer } from 'react-toastify';
import PrivateRoute from "./services/PrivateRoute.tsx";
import PublicRoute from "./services/PublicRoute.tsx";
import ReactLoading from "react-loading";
import {useTheme} from "./hooks/use-theme.ts";

const Home = lazy(() => import("./pages/Home/Home.tsx"));
const Signup = lazy(() => import("./pages/Signup/Signup.tsx"));
const Signin = lazy(() => import("./pages/Signin/Signin.tsx"));
const SignupConfirm = lazy(() => import("./pages/SignupConfirm/SignupConfirm.tsx"));
const ForgetPassword = lazy(() => import("./pages/ForgetPassword/ForgetPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword/ResetPassword.tsx"));
const EventDetail = lazy(() => import("./pages/EventDetail/EventDetail.tsx"));
const Profile = lazy(() => import("./pages/Profile/Profile.tsx"));
const UserTickets = lazy(() => import("./pages/UserTickets/UserTickets.tsx"));
const AddEvent = lazy(() => import("./pages/AddEvent/AddEvent.tsx"));
const Statistics = lazy(() => import("./pages/Statistics/Statistics.tsx"));

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/">
            <Route element={<PrivateRoute />}>
                <Route index element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><Home /></Suspense>} />
                <Route path='events/:eventId' element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><EventDetail /></Suspense>} />
                <Route path='profile' element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><Profile /></Suspense>} />
                <Route path='user_tickets' element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><UserTickets /></Suspense>} />

                <Route path="/admin/">
                    <Route path='create_event' element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><AddEvent /></Suspense>} />
                    <Route path='statistics' element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><Statistics /></Suspense>} />
                </Route>
            </Route>

            <Route element={<PublicRoute restricted />}>
                <Route path="signup" element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><Signup /></Suspense>} />
                <Route path="signin" element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><Signin /></Suspense>} />
                <Route path="auth/registration_confirm/:verificationToken" element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><SignupConfirm /></Suspense>} />
                <Route path="auth/reset_password/:resetPasswordToken" element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><ResetPassword /></Suspense>} />
                <Route path='forget-password' element={<Suspense fallback={<ReactLoading type='spin' color='#2F80ED' height={667} width={375} delay={1000}/>}><ForgetPassword /></Suspense>} />
            </Route>

            {/*<Route path="*" element={<h1>Page not found</h1>} />*/}
        </Route>
    )
);

function App() {
    // @ts-ignore
    const { theme, setTheme } = useTheme();

    return (
        <>
            <RouterProvider router={router} />
            <ToastContainer />
        </>
    );
}

export default App;
