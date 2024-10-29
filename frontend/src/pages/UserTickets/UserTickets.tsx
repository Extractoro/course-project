import './UserTickets.scss'
import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import {useFetchUserTicketsQuery} from "../../redux/fetch/fetch_api.ts";
import {useEffect, useState} from "react";
import {useCurrentUserQuery} from "../../redux/user/users_api.ts";
import {toast} from "react-toastify";
import {UserTicketsData} from "../../interfaces/fetch/UserTicketsResponse.ts";
import {DateTime} from "luxon";
import TicketsReturnForm from "../../components/TicketsReturnForm/TicketsReturnForm.tsx";
import {useSelector} from "react-redux";
import {selectUserId,} from "../../redux/auth/auth_selector.ts";
import {usePayTicketsMutation} from "../../redux/tickets/tickets_api.ts";

const UserTickets = () => {
    const [payTickets] = usePayTicketsMutation()
    const userId = useSelector(selectUserId);
    const {
        data: userInfo,
        error: userError,
        isLoading: userLoading,
        refetch: refetchUser
    } = useCurrentUserQuery({userId});

    useEffect(() => {
        refetchUser();
    }, []);

    const {data, isLoading, isError, refetch: refetchTickets} = useFetchUserTicketsQuery({user_id: userId});

    useEffect(() => {
        refetchTickets();
    }, []);

    const [ticketsVisible, setTicketsVisible] = useState<{ [key: number]: boolean }>({});
    const [isClicked, setIsClicked] = useState(false);
    const [ticketQuantity, setTicketQuantity] = useState<{ [key: number]: number }>({});

    const handleClick = () => {
        setIsClicked(prevState => !prevState);
    };

    const toggleTicketsVisibility = (eventId: number) => {
        setTicketsVisible(prev => ({...prev, [eventId]: !prev[eventId]}));
    };

    const handleQuantityChange = (eventId: number, quantity: number) => {
        setTicketQuantity(prev => ({...prev, [eventId]: quantity}));
    };

    const handlePurchase = async (eventId: number) => {
        const quantity = ticketQuantity[eventId];

        if (!quantity || quantity < 1) {
            toast.error("Please enter a valid number of tickets to purchase.", {
                autoClose: 2000,
            });
            return;
        }

        const userTickets = data?.data.filter(ticket =>
            ticket.event_id === Number(eventId) && ticket.ticket_status === "booked"
        ) || [];
        const totalUserTickets = userTickets.length;

        console.log(totalUserTickets)

        if (quantity > totalUserTickets) {
            toast.error(`You cannot pay more tickets than you have. You have ${totalUserTickets} booked tickets for this event.`, {
                autoClose: 2000,
            });
            return;
        }

        try {
            await payTickets({ user_id: Number(userInfo?.results[0].user_id), quantity, event_id: eventId }).unwrap();
            toast.success(`Purchased ${quantity} ticket(s) for event ID ${eventId}`, {
                autoClose: 2000,
            });
            window.location.reload();
        } catch (error) {
            toast.error("Failed to pay tickets. Please try again.", {
                autoClose: 2000,
            });
        }
    };

    const groupedTickets = data?.data?.reduce((acc: { [key: number]: any[] }, ticket: UserTicketsData) => {
        const {event_id, event_date} = ticket;
        const eventDateKiev = DateTime.fromISO(event_date, {zone: 'utc'}).setZone('Europe/Kiev');

        if (eventDateKiev >= DateTime.now().setZone('Europe/Kiev')) {
            if (!acc[event_id]) {
                acc[event_id] = [];
            }
            acc[event_id].push(ticket);
        }
        return acc;
    }, {});

    if (userLoading) return <p>Loading user...</p>;
    if (userError || !userInfo?.results?.length) {
        toast.error("Something went wrong!");
        return <p>Error loading user data.</p>;
    }

    return (
        <>
            <Header/>
            <Container>
                <div className='user__tickets-center'>
                    <div className='user__tickets-wrapper'>
                        {isLoading && <p>Tickets loading...</p>}
                        {isError && <h3 className='user__tickets-title'>
                            You have not got tickets!
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
                                            {/* Форма для ввода количества билетов */}
                                            <div className="user__tickets-purchase-form">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={ticketQuantity[Number(eventId)] || 0}
                                                    onChange={(e) => handleQuantityChange(Number(eventId), parseInt(e.target.value))}
                                                    className="user__tickets-quantity-input"
                                                />
                                                <button
                                                    onClick={() => handlePurchase(Number(eventId))}
                                                    className="user__tickets-purchase-button"
                                                >
                                                    Buy Tickets
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {!isError && groupedTickets && !(Object.keys(groupedTickets).length === 0) ?
                            <button
                                className={`user__tickets-button ${isClicked ? 'user__tickets-button-disabled' : ''}`}
                                type='button' disabled={isClicked} onClick={handleClick}>Return tickets
                            </button> : <h3 className='user__tickets-title'>
                                You have not got tickets!
                            </h3>
                        }

                        {isClicked && (
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
export default UserTickets;
