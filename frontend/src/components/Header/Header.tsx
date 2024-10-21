import {Link, useNavigate} from "react-router-dom";
import {IoMenu} from "react-icons/io5";
import {FaXmark} from "react-icons/fa6";
import {useState} from "react";
import sprite from '../../assets/symbol-defs.svg';
import './Header.scss'
import Container from "../Container/Container.tsx";
import {useLogoutMutation} from "../../redux/auth/auth_api.ts";
import {toast} from "react-toastify";
import Cookies from "js-cookie";
import {HiOutlineTicket} from "react-icons/hi";
import {FaRegUser} from "react-icons/fa";
import {TbLogout2} from "react-icons/tb";
import {useSelector} from "react-redux";
import {selectUserRole} from "../../redux/auth/auth_selector.ts";
import {ImStatsDots} from "react-icons/im";

const Header = () => {
    const navigate = useNavigate();
    const [logout] = useLogoutMutation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const token = Cookies.get('token');

    const currentUser = useSelector(selectUserRole);
    const isAdmin = currentUser === 'admin';

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await logout(undefined).unwrap();
            toast.success('You have been logged out.', {
                autoClose: 2000,
            })
            navigate("/signin");
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const navItems = [
        {link: 'Profile', path: '/profile', isLogout: false, isStats: false},
        {link: 'Tickets', path: '/user_tickets', isLogout: false, isStats: false},
        {link: 'Stats', path: '/admin/statistics', isLogout: false, isStats: true},
        {link: 'Log Out', path: '/logout', isLogout: true, isStats: false},
    ]

    return (
        <>
            <header className="header">
                <Container>
                    <div className="header__wrapper">
                        <Link to={'/'} className="header__logo">
                            <svg className="header__logo-icon">
                                <use href={`${sprite}#logo`}></use>
                            </svg>
                            <span className="header__logo-span">EventNest</span>
                        </Link>

                        {token && (
                            <div className="header__profile">
                                <div className="header__profile-menu">
                                    <button onClick={toggleMenu} className="header__profile-button">
                                        {isMenuOpen ? (
                                            <FaXmark className="header__menu-icon header__menu-icon--close"/>
                                        ) : (
                                            <IoMenu className="header__menu-icon header__menu-icon--open"/>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </Container>
            </header>

            {token && (
                <div className={`menu ${isMenuOpen ? "menu--open" : "menu--closed"}`}>
                    {navItems.map(({link, path, isLogout, isStats}) => (
                        <div key={link} className="menu__item" onClick={isLogout ? handleLogout : undefined}>
                            {isLogout && (
                                <button onClick={toggleMenu} className="menu__link">
                                    <TbLogout2 className='menu__link-icon'/>
                                    {link}
                                </button>
                            )}
                            {isStats && isAdmin && (
                                <Link to={path} onClick={toggleMenu} className="menu__link">
                                    <ImStatsDots className='menu__link-icon'/>
                                    {link}
                                </Link>
                            )}
                            {!isStats && !isLogout && (<Link to={path} onClick={toggleMenu} className="menu__link">
                                {link === 'Profile' ? <FaRegUser className='menu__link-icon'/> :
                                    <HiOutlineTicket className='menu__link-icon'/>}
                                {link}
                            </Link>)
                            }

                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default Header;