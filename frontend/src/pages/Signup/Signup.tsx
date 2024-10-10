import Header from "../../components/Header/Header.tsx";
import SignupForm from "../../components/SignupForm/SignupForm.tsx";
import Container from "../../components/Container/Container.tsx";

const Signup = () => {
    return (
        <>
            <Header/>
            <Container>
                <SignupForm/>
            </Container>
        </>
    );
};

export default Signup;