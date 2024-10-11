import {ChangeEvent, FormEvent, useState} from "react";
import {toast} from "react-toastify";
import {useForgetPasswordMutation} from "../../redux/auth/auth_api.ts";
import './ForgetPasswordForm.scss'
import {Link} from "react-router-dom";

const ForgetPasswordForm = () => {
    const [forgetPassword] = useForgetPasswordMutation();
    const [email, setEmail] = useState("");

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        switch (name) {
            case 'email':
                setEmail(value);
                break;

            default:
                return;
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();
            await forgetPassword({email}).unwrap()

            toast.success(`Check your email.`, {
                autoClose: 2000,
            });
            reset();
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
    };


    return (
        <div className="forgetPassword__wrapper">
            <h1 className="forgetPassword__title">Reset password</h1>
            <form className='forgetPassword__form' onSubmit={handleSubmit}>
                <div className='forgetPassword__form-container'>
                    <label className='forgetPassword__form-label' htmlFor="email">Email</label>
                    <input className='forgetPassword__form-input' onChange={handleChange} type="email" id="email"
                           name="email"
                           value={email} pattern=".{1,100}"
                           title="Email must not exceed 100 characters." required/>
                </div>
                <button className='forgetPassword__form-button' type="submit">Reset password</button>
                <p className='forgetPassword__form-paragraph'>Remember password? <Link
                    className='forgetPassword__form-paragraph--link' to={'/signin'}>Sign in</Link></p>
            </form>
        </div>
    );
};

export default ForgetPasswordForm;