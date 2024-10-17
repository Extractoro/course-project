import {ChangeEvent, FC, FormEvent, useState} from "react";
import {FaRegEye, FaRegEyeSlash} from "react-icons/fa6";
import './UserForm.scss'
import {UsersResponse} from "../../interfaces/users/UsersResponse.ts";
import {toast} from "react-toastify";
import {useUpdateUserMutation} from "../../redux/user/users_api.ts";

type UserFormProps = {
    userInfo: UsersResponse
}

const UserForm: FC<UserFormProps> = ({userInfo}) => {
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

    const handleClick = () => setShow(!show);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        switch (name) {
            case 'firstname':
                setFirstname(value);
                break;
            case 'setLastname':
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

        try {
            await updateUser({user_id, firstname, lastname, email, phone, password}).unwrap()
            toast.success('You successfully update profile!', {
                autoClose: 2000,
            });
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
                           name="quantity"
                           value={firstname} pattern=".{1,50}"
                           title="Firstname must not exceed 50 characters." required/>
                </div>
                <div className='user-form-container'>
                    <label className='user-form-label' htmlFor="lastname">Lastname</label>
                    <input className='user-form-input' onChange={handleChange} type="text" id="lastname"
                           name="quantity"
                           value={lastname} pattern=".{1,50}"
                           title="Lastname must not exceed 50 characters." required/>
                </div>
                <div className='user-form-container'>
                    <label className='user-form-label' htmlFor="phone">Phone</label>
                    <input className='user-form-input' onChange={handleChange} type="tel" id="phone"
                           name="quantity"
                           value={phone} pattern="^[0-9]{10,20}$"
                           title="Phone number must be between 10 and 20 digits."/>
                </div>
                <div className='user-form-container'>
                    <label className='user-form-label' htmlFor="email">Email</label>
                    <input className='user-form-input' onChange={handleChange} type="email" id="email"
                           name="quantity"
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
                <button className='user-form-button' type="submit">Change profile</button>
            </form>
        </div>
    )
}
export default UserForm