import './EventInfo.scss'
import {useFetchCategoriesQuery, useFetchEventsQuery} from "../../redux/fetch/fetch_api.ts";
import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {CategoriesData} from "../../interfaces/fetch/CategoryResponse.ts";
import {DateTime} from "luxon";
import TicketsForm from "../TicketsForm/TicketsForm.tsx";
import {useCurrentUserQuery} from "../../redux/user/users_api.ts";

const EventInfo = () => {
    const navigate = useNavigate();
    const {data: eventsData, error: eventsError, isLoading: eventsLoading} = useFetchEventsQuery();
    const {data: categoriesData} = useFetchCategoriesQuery();
    const {data: userData} = useCurrentUserQuery();
    const {eventId} = useParams<{ eventId: string }>();
    const [isClicked, setIsClicked] = useState(false);

    const eventById = eventsData?.data?.find(event => {
        return event?.event_id === Number(eventId);
    });

    const [availableTicketsState, setAvailableStateTickets] = useState<number>(Number(eventById?.available_tickets));

    useEffect(() => {
        if (!eventsLoading && !eventById) {
            navigate('/');
        }
    }, [eventById, eventsLoading, navigate]);

    const categoryName = categoriesData?.data?.find((category: CategoriesData) => category.category_id === eventById?.category_id)?.category_name || '';

    const handleClick = () => {
        setIsClicked(prevState => {
            return !prevState;
        });
    }

    return (
        <>
            {eventsLoading && <p>Error</p>}
            {eventsError && <p>Loading...</p>}
            {eventById && (
                <div className='event-info-center'>
                    <div className='event-info__wrapper'>
                        <h2 className='event-info__title'>{eventById.event_name}</h2>
                        <p className='event-info__category'>{categoryName} | <span
                            className='event-info__date'>{DateTime.fromISO(eventById.event_date, {zone: 'utc'}).setZone('Europe/Kiev').toISODate()}</span>
                        </p>
                        <p className='event-info__address'><span
                            className='event-info__city'>{eventById.city}</span>, {eventById.address}, <span
                            className='event-info__venue'>{eventById.venue_name}</span></p>
                        <p className='event-info__description'>{eventById.description || 'No description provided'}</p>
                        <div className='event__tickets-info'>
                            <p className='event__tickets-tickets'>
                                <strong>Tickets: </strong>{availableTicketsState > 0 ? `${availableTicketsState} available` : 'Sold out'}
                            </p>
                            <p className='event__tickets-price'><strong>Price: </strong>{eventById.ticket_price} UAH</p>
                        </div>
                        <button className={`event-info__button ${isClicked ? 'event-info__button-disabled' : ''}`}
                                type='button' disabled={isClicked} onClick={handleClick}>Book
                            ticket
                        </button>
                    </div>
                </div>
            )}
            {isClicked && eventId && userData && (
                <div className='event-info-center'>
                    <TicketsForm eventId={eventId} userData={userData} availableTicketsState={availableTicketsState} setAvailableStateTickets={setAvailableStateTickets}/>
                </div>)}
        </>
    );
};

export default EventInfo;

