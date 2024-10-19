import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import EventAddForm from "../../components/EventAddForm/EventAddForm.tsx";

const AddEvent = () => {
    return (
        <>
            <Header/>
            <Container>
               <EventAddForm/>
            </Container>
        </>
    )
}
export default AddEvent
