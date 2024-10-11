import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import ResetPasswordForm from "../../components/ResetPasswordForm/ResetPasswordForm.tsx";

const ResetPassword = () => {
    return (
        <>
            <Header/>
            <Container>
                <ResetPasswordForm/>
            </Container>
        </>
    );
};

export default ResetPassword;