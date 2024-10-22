import './UserTickets.scss'
import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import {useFetchUserTicketsQuery} from "../../redux/fetch/fetch_api.ts";
import { useState} from "react";
import {useCurrentUserQuery} from "../../redux/user/users_api.ts";
import {toast} from "react-toastify";
import {UserTicketsData} from "../../interfaces/fetch/UserTicketsResponse.ts";
import {DateTime} from "luxon";
import TicketsReturnForm from "../../components/TicketsReturnForm/TicketsReturnForm.tsx";

const UserTickets = () => {
    const {data: userInfo, error: userError, isLoading: userLoading} = useCurrentUserQuery();

    if (userLoading) return <p>Loading user...</p>;
    if (userError || !userInfo?.results?.length) {
        toast.error("Something went wrong!");
        return <p>Error loading user data.</p>;
    }

    const userId = userInfo.results[0]?.user_id;

    const {data, isLoading, isError} = useFetchUserTicketsQuery({user_id: userId});
    const [ticketsVisible, setTicketsVisible] = useState<{ [key: number]: boolean }>({});
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked(prevState => !prevState);
    };

    const toggleTicketsVisibility = (eventId: number) => {
        setTicketsVisible(prev => ({...prev, [eventId]: !prev[eventId]}));
    };

    const groupedTickets = data?.data?.reduce((acc: { [key: number]: any[] }, ticket: UserTicketsData) => {
        const {event_id} = ticket;
        if (!acc[event_id]) {
            acc[event_id] = [];
        }
        acc[event_id].push(ticket);
        return acc;
    }, {});

    return (
        <>
            <Header/>
            <Container>
                <div className='user__tickets-center'>
                    <div className='user__tickets-wrapper'>
                        {isLoading && <p>Tickets loading...</p>}
                        {isError && <h3 className='user__tickets-title'>
                            You have not got a tickets!
                        </h3>}
                        {groupedTickets && Object.keys(groupedTickets).map(eventId => {
                            const ticketsForEvent = groupedTickets[Number(eventId)];
                            const eventName = ticketsForEvent[0].event_name;

                            return (
                                <div key={eventId} className="user__tickets">
                                    <h3 onClick={() => toggleTicketsVisibility(Number(eventId))}
                                        className='user__tickets-title'>
                                        {eventName} (ID: {eventId})
                                    </h3>
                                    {ticketsVisible[Number(eventId)] && (
                                        <div className="user__tickets-container">
                                            <div className="user__tickets-scrollable">
                                                {ticketsForEvent.map((ticket: UserTicketsData) => (
                                                    <div key={ticket.ticket_id} className="user__tickets-card">
                                                        <p className='user__tickets-paragraph'>Tickets
                                                            ID: {ticket.ticket_id}</p>
                                                        <p className='user__tickets-paragraph'>Event
                                                            name: {ticket.event_name}</p>
                                                        <p className='user__tickets-paragraph'>Event
                                                            date: {DateTime.fromISO(ticket.event_date, {zone: 'utc'}).setZone('Europe/Kiev').toISODate()}</p>
                                                        <p className='user__tickets-paragraph'>Purchase
                                                            date: {DateTime.fromISO(ticket.purchase_date, {zone: 'utc'}).setZone('Europe/Kiev').toISODate()}</p>
                                                        <p className='user__tickets-paragraph'>Ticket
                                                            status: {ticket.ticket_status}</p>
                                                        <p className='user__tickets-paragraph'>Price:
                                                            ${ticket.ticket_price.toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {!isError &&
                            <button
                                className={`user__tickets-button ${isClicked ? 'user__tickets-button-disabled' : ''}`}
                                type='button' disabled={isClicked} onClick={handleClick}>Return tickets
                            </button>
                        }

                        {isClicked && userInfo && (
                            <div className='user__tickets-center'>
                                <TicketsReturnForm userInfo={userInfo} ticketsInfo={data}/>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </>
    )
}
export default UserTickets
