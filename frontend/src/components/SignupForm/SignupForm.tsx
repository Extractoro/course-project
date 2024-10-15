import {ChangeEvent, FormEvent, MouseEvent, useState} from "react";
import {FaRegEye} from "react-icons/fa6";
import {FaRegEyeSlash} from "react-icons/fa6";
import './SignupForm.scss'
import {Link} from "react-router-dom";
import {useConfirmResendMutation, useSignUpMutation} from "../../redux/auth/auth_api.ts";
import {toast} from "react-toastify";

const SignupForm = () => {
    const [signup] = useSignUpMutation();
    const [confirmResend] = useConfirmResendMutation();
    const [show, setShow] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const handleClick = () => setShow(!show);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        switch (name) {
            case 'firstName':
                setFirstName(value);
                break;

            case 'lastName':
                setLastName(value);
                break;

            case 'email':
                setEmail(value);
                break;

            case 'phone':
                setPhone(value);
                break;

            case 'password':
                setPassword(value);
                break;

            default:
                return;
        }
    };

    const handleConfirm = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!email) {
            toast.error('Enter an email in input', {
                autoClose: 2000,
            });
            return;
        }

        try {
            await confirmResend({ email }).unwrap();
            toast.success('Confirmation has been resent!', {
                autoClose: 2000,
            });
        } catch (err: any) {
            toast.error('Failed to resend confirmation email.', {
                autoClose: 2000,
            });
        }
    };


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            await signup({firstName, lastName, email, phone, password}).unwrap()

            toast.success('Successfully registered. Now confirm your email!', {
                autoClose: 2000,
            })
            reset();
        } catch (err: any) {
            toast.error('Something went wrong', {
                autoClose: 2000,
            });
        }

    };

    const reset = () => {
        setFirstName('')
        setLastName('')
        setEmail('')
        setPhone('')
        setPassword('');
    };

    return (
        <div className="signup__wrapper">
            <h1 className="signup__title">Sign up</h1>
            <form className='signup__form' onSubmit={handleSubmit}>
                <div className='signup__form-container'>
                    <label className='signup__form-label' htmlFor="firstname">First name</label>
                    <input className='signup__form-input' onChange={handleChange} type="text" id="firstname"
                           name="firstName" value={firstName} pattern=".{1,50}"
                           title="Firstname must not exceed 50 characters." required/>
                </div>
                <div className='signup__form-container'>
                    <label className='signup__form-label' htmlFor="lastname">Last name</label>
                    <input className='signup__form-input' onChange={handleChange} type="text" id="lastname"
                           name="lastName" value={lastName} pattern=".{1,50}"
                           title="Lastname must not exceed 50 characters." required/>
                </div>
                <div className='signup__form-container'>
                    <label className='signup__form-label' htmlFor="email">Email</label>
                    <input className='signup__form-input' onChange={handleChange} type="email" id="email" name="email"
                           value={email} pattern=".{1,100}"
                           title="Email must not exceed 100 characters." required/>
                </div>
                <div className='signup__form-container'>
                    <label className='signup__form-label' htmlFor="phone">Phone</label>
                    <input className='signup__form-input' onChange={handleChange} type="tel" id="phone" name="phone"
                           value={phone} pattern="^[0-9]{10,20}$"
                           title="Phone number must be between 10 and 20 digits."/>
                </div>
                <div className='signup__form-container'>
                    <label className='signup__form-label' htmlFor="password">Password</label>
                    <div className='signup__form-container--input'>
                        <input className='signup__form-input' onChange={handleChange} type={show ? 'text' : 'password'}
                               id="password" name="password" value={password}
                               pattern=".{1,255}"
                               title="Password must not exceed 255 characters." required/>
                        <button
                            type="button"
                            className='signup__form-input--button'
                            onClick={handleClick}
                        >
                            {show ? <FaRegEyeSlash size={18}/> : <FaRegEye size={18}/>}
                        </button>
                    </div>
                </div>
                <button className='signin__form-button--link' onClick={handleConfirm}>Resend verification</button>
                <button className='signup__form-button' type="submit">Sign up</button>
                <p className='signup__form-paragraph'>Already have an account? <Link
                    className='signup__form-paragraph--link' to={'/signin'}>Sign in</Link></p>
            </form>
        </div>
    );
};

export default SignupForm;