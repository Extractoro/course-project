import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import EventInfo from "../../components/EventInfo/EventInfo.tsx";

const EventDetail = () => {
    return (
        <div>
            <Header/>
            <Container>
                <EventInfo/>
            </Container>
        </div>
    );
};

export default EventDetail;