import './Profile.scss'
import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import {useCurrentUserQuery} from "../../redux/user/users_api.ts";
import {useState} from "react";
import UserForm from "../../components/UserForm/UserForm.tsx";
import {selectUserId} from "../../redux/auth/auth_selector.ts";
import {useSelector} from "react-redux";

const Profile = () => {
    const userId = useSelector(selectUserId);
    const {data: userInfo, error: userError, isLoading: userLoading} = useCurrentUserQuery({userId})
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked(prevState => {
            return !prevState;
        });
    }

    return (
        <>
            <Header/>
            <Container>
                {userError && <p>Error</p>}
                {userLoading && <p>Loading...</p>}
                {userInfo && userInfo?.results && (
                    <div className='profile'>
                        <div className='profile__container'>
                            <h2 className='profile__title'>Welcome, {userInfo?.results[0]?.user_firstname} {userInfo?.results[0]?.user_lastname}</h2>
                            <div className='profile__wrapper' lang='en'>
                                <div className='profile__info'>
                                    <h5 className='profile__info-title'>Email:</h5>
                                    <p className='profile__info-description'>{userInfo?.results[0]?.email}</p>
                                </div>
                                <div className='profile__info'>
                                    <h5 className='profile__info-title'>Phone:</h5>
                                    <p className='profile__info-description'>{userInfo?.results[0]?.phone || 'No phone provided'}</p>
                                </div>
                            </div>

                            <button
                                className={`profile__info-button ${isClicked ? 'profile__info-button-disabled' : ''}`}
                                type='button' disabled={isClicked} onClick={handleClick}>Change profile
                            </button>
                        </div>
                    </div>
                )}
                {isClicked && userInfo && (
                    <div className='profile__info-center'>
                        <UserForm userInfo={userInfo}/>
                    </div>
                )}
            </Container>
        </>
    )
}
export default Profile
