import {Link} from "react-router-dom";
import { IoMenu } from "react-icons/io5";
import { FaXmark } from "react-icons/fa6";
import {useState} from "react";
import sprite from '../../assets/symbol-defs.svg';
import './Header.scss'
import Container from "../Container/Container.tsx";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const navItems = [
        { link: 'Profile', path: '/profile' },
        { link: 'Log Out', path: '/logout' }
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

                        <div className="header__profile">
                            <div className="header__profile-menu">
                                <button onClick={toggleMenu} className="header__profile-button">
                                    {isMenuOpen ? (
                                        <FaXmark className="header__menu-icon header__menu-icon--close" />
                                    ) : (
                                        <IoMenu className="header__menu-icon header__menu-icon--open" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                </Container>
            </header>

            <div className={`menu ${isMenuOpen ? "menu--open" : "menu--closed"}`}>
                {navItems.map(({ link, path }) => (
                    <Link
                        key={link}
                        to={path}
                        onClick={toggleMenu}
                        className="menu__item"
                    >
                        {link}
                    </Link>
                ))}
            </div>
        </>
    );
};

export default Header;