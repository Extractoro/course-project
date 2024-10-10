import './App.scss'
import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider} from "react-router-dom";
import Home from "./pages/Home/Home.tsx";
import {useTheme} from "./hooks/use-theme.ts";
import Signup from "./pages/Signup/Signup.tsx";
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Signin from "./pages/Signin/Signin.tsx";

const router = createBrowserRouter(createRoutesFromElements(
        <Route path="/">
            <Route index element={<Home/>}/>
            <Route path="signup" element={<Signup/>}/>
            <Route path="signin" element={<Signin />} />
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
