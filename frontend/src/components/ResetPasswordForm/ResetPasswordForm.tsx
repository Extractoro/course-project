import { ChangeEvent, FormEvent, useState } from 'react';
import { useResetPasswordMutation } from "../../redux/auth/auth_api.ts"; // Adjust the hook to your API
import { toast } from "react-toastify";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import {useNavigate, useParams} from "react-router-dom";
import './ResetPasswordForm.scss'

const ResetPasswordForm = () => {
    let navigate = useNavigate();
    const { resetPasswordToken } = useParams<{ resetPasswordToken: string }>();
    const [resetPassword] = useResetPasswordMutation();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const handleClickPassword = () => setShowPassword(!showPassword);
    const handleClickConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        switch (name) {
            case 'password':
                setPassword(value);
                break;

            case 'passwordConfirm':
                setPasswordConfirm(value);
                break;

            default:
                return;
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            toast.error("Passwords do not match!", {
                autoClose: 2000,
            });
            return;
        }

        const newPassword = password;

        try {
            if (!resetPasswordToken) {
                toast.error("Reset password token is missing!", {
                    autoClose: 2000,
                });
                return;
            }

            await resetPassword({ resetPasswordToken, newPassword }).unwrap();
            toast.success("Password has been reset successfully!", {
                autoClose: 2000,
            });
            reset();
            navigate("/signin");
        } catch (err: any) {
            if (err.data?.message) {
                toast.error(`${err.data?.message}`, {
                    autoClose: 2000,
                });
            }
        }
    };

    const reset = () => {
        setPassword('');
        setPasswordConfirm('');
    };

    return (
        <div className="reset-password__wrapper">
            <h1 className="reset-password__title">Reset Password</h1>
            <form className='reset-password__form' onSubmit={handleSubmit}>
                <div className='reset-password__form-container'>
                    <label className='reset-password__form-label' htmlFor="password">New Password</label>
                    <div className='reset-password__form-container--input'>
                        <input
                            className='reset-password__form-input'
                            onChange={handleChange}
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={password}
                            pattern=".{1,255}"
                            title="Password must not exceed 255 characters."
                            required
                        />
                        <button
                            type="button"
                            className='reset-password__form-input--button'
                            onClick={handleClickPassword}
                        >
                            {showPassword ? <FaRegEyeSlash size={18} /> : <FaRegEye size={18} />}
                        </button>
                    </div>
                </div>
                <div className='reset-password__form-container'>
                    <label className='reset-password__form-label' htmlFor="passwordConfirm">Confirm New Password</label>
                    <div className='reset-password__form-container--input'>
                        <input
                            className='reset-password__form-input'
                            onChange={handleChange}
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="passwordConfirm"
                            name="passwordConfirm"
                            value={passwordConfirm}
                            pattern=".{1,255}"
                            title="Password must not exceed 255 characters."
                            required
                        />
                        <button
                            type="button"
                            className='reset-password__form-input--button'
                            onClick={handleClickConfirmPassword}
                        >
                            {showConfirmPassword ? <FaRegEyeSlash size={18} /> : <FaRegEye size={18} />}
                        </button>
                    </div>
                </div>

                <button className='reset-password__form-button' type="submit">Reset Password</button>
            </form>
        </div>
    );
};

export default ResetPasswordForm;
