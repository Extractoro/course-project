import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import ForgetPasswordForm from "../../components/ForgetPassword/ForgetPasswordForm.tsx";

const ForgetPassword = () => {
    return (
        <>
            <Header/>
            <Container>
                <ForgetPasswordForm/>
            </Container>
        </>
    );
};

export default ForgetPassword;