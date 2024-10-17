import {ChangeEvent, FC, FormEvent, useState} from "react";
import {FaRegEye, FaRegEyeSlash} from "react-icons/fa6";
import './UserForm.scss'
import {UsersResponse} from "../../interfaces/users/UsersResponse.ts";
import {toast} from "react-toastify";
import {useUpdateUserMutation} from "../../redux/user/users_api.ts";
import Cookies from "js-cookie";
import {useNavigate} from "react-router-dom";

type UserFormProps = {
    userInfo: UsersResponse
}

const UserForm: FC<UserFormProps> = ({userInfo}) => {
    const navigate = useNavigate();
    const [updateUser] = useUpdateUserMutation()

    if (!userInfo?.results) {
        toast.error("Something went wrong!");
        return
    }
    // ???

    const [firstname, setFirstname] = useState(userInfo?.results[0]?.user_firstname || '')
    const [lastname, setLastname] = useState(userInfo?.results[0]?.user_lastname || '')
    const [email, setEmail] = useState(userInfo?.results[0]?.email || '')
    const [phone, setPhone] = useState(userInfo?.results[0]?.phone || '')
    const [password, setPassword] = useState('')
    const [show, setShow] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    const handleClickDisable = () => {
        setIsClicked(prevState => {
            return !prevState;
        });
    }

    const handleClick = () => setShow(!show);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        switch (name) {
            case 'firstname':
                setFirstname(value);
                break;
            case 'lastname':
                setLastname(value);
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

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userInfo?.results) {
            toast.error("Something went wrong!");
            return
        }

        const user_id: number = userInfo?.results[0]?.user_id
        const oldEmail = userInfo?.results[0]?.email

        try {
            await updateUser({user_id, firstname, lastname, email, phone, password}).unwrap()

            if (oldEmail === email) {
                toast.success('You successfully update profile! Reload a page.', {
                    autoClose: 2000,
                });
            } else {
                toast.success('You successfully update profile! Check your email.', {
                    autoClose: 2000,
                });
                Cookies.remove('token', {secure: true, sameSite: 'Strict'});
                navigate('/signin')
            }

            reset()
        } catch (err: any) {
            if (err.data?.message) {
                toast.error(`${err.data?.message}`, {
                    autoClose: 2000,
                });
            }
        }
    }

    const reset = () => {
        if (userInfo?.results) {
            setFirstname(userInfo?.results[0]?.user_firstname)
            setLastname(userInfo?.results[0]?.user_lastname)
            setPhone(userInfo?.results[0]?.phone)
            setEmail(userInfo?.results[0]?.email)
            setPassword('');
        }
    }

    return (
        <div>
            <form className='user-form' onSubmit={handleSubmit}>
                <div className='user-form-container'>
                    <label className='user-form-label' htmlFor="firstname">Firstname</label>
                    <input className='user-form-input' onChange={handleChange} type="text" id="firstname"
                           name="firstname"
                           value={firstname} pattern=".{1,50}"
                           title="Firstname must not exceed 50 characters." required/>
                </div>
                <div className='user-form-container'>
                    <label className='user-form-label' htmlFor="lastname">Lastname</label>
                    <input className='user-form-input' onChange={handleChange} type="text" id="lastname"
                           name="lastname"
                           value={lastname} pattern=".{1,50}"
                           title="Lastname must not exceed 50 characters." required/>
                </div>
                <div className='user-form-container'>
                    <label className='user-form-label' htmlFor="phone">Phone</label>
                    <input className='user-form-input' onChange={handleChange} type="tel" id="phone"
                           name="phone"
                           value={phone} pattern="^[0-9]{10,20}$"
                           title="Phone number must be between 10 and 20 digits."/>
                </div>
                <div className='user-form-container'>
                    <label className='user-form-label' htmlFor="email">Email</label>
                    <input className='user-form-input' onChange={handleChange} type="email" id="email"
                           name="email"
                           value={email} pattern=".{1,100}"
                           title="Email must not exceed 100 characters." required/>
                </div>
                <div className='user-form-container'>
                    <label className='user-form-label' htmlFor="password">Password</label>
                    <div className='user-form-container--input'>
                        <input className='user-form-input' onChange={handleChange} type={show ? 'text' : 'password'}
                               id="password" name="password" value={password}
                               pattern=".{1,255}"
                               title="Password must not exceed 255 characters."/>
                        <button
                            type="button"
                            className='user-form-input--button'
                            onClick={handleClick}
                        >
                            {show ? <FaRegEyeSlash size={18}/> : <FaRegEye size={18}/>}
                        </button>
                    </div>
                </div>
                <button className={`user-form-button ${isClicked ? 'profile__info-button-disabled' : ''}`} type="submit"
                         onClick={handleClickDisable} disabled={isClicked}>Change profile
                </button>
            </form>
        </div>
    )
}
export default UserForm
