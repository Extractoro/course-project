import Header from "../../components/Header/Header.tsx";
import SigninForm from "../../components/SigninForm/SigninForm.tsx";
import Container from "../../components/Container/Container.tsx";

const Signin = () => {
    return (
        <>
            <Header/>
            <Container>
                <SigninForm/>
            </Container>
        </>
    );
};

export default Signin;