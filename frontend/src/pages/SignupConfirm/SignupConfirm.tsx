import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import {useParams} from "react-router-dom";
import {useEffect} from "react";
import {useSignUpConfirmationMutation} from "../../redux/auth/auth_api.ts";
import {toast} from "react-toastify";
import "./SignupConfirm.scss"

const SignupConfirm = () => {
    const [signUpConfirmation] = useSignUpConfirmationMutation()
    const {verificationToken = ''} = useParams<{ verificationToken: string }>();

    console.log(verificationToken)

    if (!verificationToken || verificationToken === '') {
        toast.error('Something went wrong!');
    }

    useEffect(() => {
        const confirm = async () => {
            try {
                await signUpConfirmation({verificationToken}).unwrap();
            } catch (error) {
                toast.error('Something went wrong', {
                    autoClose: 2000,
                });
            }
        };

        confirm();
    }, []);

    return (
        <>
            <Header/>
            <Container>
                <div className='signupConfirm-container'>
                    <div className='signupConfirm-wrapper'>
                        <h2 className='signupConfirm-title'>Thank You for Verifying Your Email!</h2>
                        <a className='signupConfirm-link' href={`http://localhost:5173/signin`}>Go to sign in!</a>
                        <p className='signupConfirm-paragraph'>Thank you for being a part of EventNest. If you have any
                            questions, feel free to contact our support
                            team.</p>
                    </div>
                </div>
            </Container>
        </>
    );
};

export default SignupConfirm;