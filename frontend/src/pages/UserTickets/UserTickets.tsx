import './UserTickets.scss'
import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import {useFetchUserTicketsMutation} from "../../redux/fetch/fetch_api.ts";
import {useEffect, useState} from "react";
import {useCurrentUserQuery} from "../../redux/user/users_api.ts";
import {toast} from "react-toastify";
import {UserTicketsData} from "../../interfaces/fetch/UserTicketsResponse.ts";
import {DateTime} from "luxon";
import TicketsReturnForm from "../../components/TicketsReturnForm/TicketsReturnForm.tsx";

const UserTickets = () => {
    const {data: userInfo, error: userError, isLoading: userLoading} = useCurrentUserQuery()
    const [fetchUserTickets, {data, isLoading, isError}] = useFetchUserTicketsMutation();
    const [ticketsVisible, setTicketsVisible] = useState<{ [key: number]: boolean }>({});
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked(prevState => {
            return !prevState;
        });
    }

    useEffect(() => {
        if (userLoading) return;

        if (userError) {
            toast.error("Something went wrong with user!");
            return;
        }

        if (!userInfo || !userInfo?.results || userInfo.results.length === 0) {
            toast.error("Something went wrong!");
            return
        }

        const loadUserTickets = async () => {
            try {
                const userId = userInfo?.results[0]?.user_id;
                await fetchUserTickets({user_id: userId}).unwrap();
            } catch (error) {
                console.error("Error loading tickets:", error);
            }
        };

        loadUserTickets();
    }, [fetchUserTickets, userInfo, userLoading, userError]);

    const toggleTicketsVisibility = (eventId: number) => {
        setTicketsVisible(prev => ({...prev, [eventId]: !prev[eventId]}));
    };

    const groupedTickets = data?.data.reduce((acc: { [key: number]: any[] }, ticket: any) => {
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
