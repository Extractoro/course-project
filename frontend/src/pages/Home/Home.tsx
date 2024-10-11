import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import Events from "../../components/Events/Events.tsx";


const Home = () => {
    return (
        <div>
            <Header/>
            <Container>
                <Events/>
            </Container>
        </div>
    );
};

export default Home;