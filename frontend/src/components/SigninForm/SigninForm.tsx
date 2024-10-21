import {ChangeEvent, FormEvent, useState} from "react";
import {FaRegEye} from "react-icons/fa6";
import {FaRegEyeSlash} from "react-icons/fa6";
import './SigninForm.scss'
import {Link, useNavigate} from "react-router-dom";
import {useSignInMutation} from "../../redux/auth/auth_api.ts";
import {toast} from "react-toastify";

const signinForm = () => {
    const navigate = useNavigate();
    const [signin] = useSignInMutation();
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleClick = () => setShow(!show);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        switch (name) {
            case 'email':
                setEmail(value);
                break;

            case 'password':
                setPassword(value);
                break;

            default:
                return;
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            await signin({email, password}).unwrap()
            toast.success('You successfully signed in!', {
                autoClose: 2000,
            });
            reset();
            navigate("/");
        } catch (err: any) {
            if (err.data?.message) {
                toast.error(`${err.data?.message}`, {
                    autoClose: 2000,
                });
            }
        }
    };

    const reset = () => {
        setEmail('')
        setPassword('');
    };

    return (
        <div className="signin__wrapper">
            <h1 className="signin__title">Sign in</h1>
            <form className='signin__form' onSubmit={handleSubmit}>
                <div className='signin__form-container'>
                    <label className='signin__form-label' htmlFor="email">Email</label>
                    <input className='signin__form-input' onChange={handleChange} type="email" id="email" name="email"
                           value={email} pattern=".{1,100}"
                           title="Email must not exceed 100 characters." required/>
                </div>
                <div className='signin__form-container'>
                    <label className='signin__form-label' htmlFor="password">Password</label>
                    <div className='signin__form-container--input'>
                        <input className='signin__form-input' onChange={handleChange} type={show ? 'text' : 'password'}
                               id="password" name="password" value={password}
                               pattern=".{1,255}"
                               title="Password must not exceed 255 characters." required/>
                        <button
                            type="button"
                            className='signin__form-input--button'
                            onClick={handleClick}
                        >
                            {show ? <FaRegEyeSlash size={18}/> : <FaRegEye size={18}/>}
                        </button>
                    </div>
                </div>
                <Link to={'/forget-password'} className='signin__form-paragraph--link'>Forget password?</Link>
                <button className='signin__form-button' type="submit">Sign in</button>
                <p className='signin__form-paragraph'>Don’t have an account? <Link
                    className='signin__form-paragraph--link' to={'/signup'}>Sign up</Link></p>
            </form>
        </div>
    );
};

export default signinForm;