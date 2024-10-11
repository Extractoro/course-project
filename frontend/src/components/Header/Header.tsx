import {Link, useNavigate} from "react-router-dom";
import { IoMenu } from "react-icons/io5";
import { FaXmark } from "react-icons/fa6";
import {useState} from "react";
import sprite from '../../assets/symbol-defs.svg';
import './Header.scss'
import Container from "../Container/Container.tsx";
import {useLogoutMutation} from "../../redux/auth/auth_api.ts";
import {toast} from "react-toastify";
import Cookies from "js-cookie";

const Header = () => {
    const navigate = useNavigate();
    const [logout] = useLogoutMutation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const token = Cookies.get('token');

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
        { link: 'Profile', path: '/profile', isLogout: false  },
        { link: 'Log Out', path: '/logout', isLogout: true  }
    ]

    return (
        <>
            <header className="header">
                <Container>
                    <div className="header__wrapper">
                        <div className="header__logo">
                             <svg className="header__logo-icon"><use href={`${sprite}#logo`}></use></svg>
                            <span className="header__logo-span">EventNest</span>
                        </div>

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

            <div className={`menu ${isMenuOpen ? "menu--open" : "menu--closed"}`}>
                {navItems.map(({link, path, isLogout}) => (
                    <div key={link} className="menu__item" onClick={isLogout ? handleLogout : undefined}>
                        {isLogout ? (
                            <button onClick={toggleMenu} className="menu__link">
                                {link}
                            </button>
                        ) : (
                            <Link to={path} onClick={toggleMenu} className="menu__link">
                            {link}
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};

export default Header;