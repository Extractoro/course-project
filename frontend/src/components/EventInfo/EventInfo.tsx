import './EventInfo.scss';
import { useFetchCategoriesQuery, useFetchEventsQuery } from "../../redux/fetch/fetch_api.ts";
import { useNavigate, useParams } from "react-router-dom";
import {ChangeEvent, FormEvent, MouseEventHandler, useEffect, useState} from "react";
import { CategoriesData } from "../../interfaces/fetch/CategoryResponse.ts";
import { DateTime } from "luxon";
import TicketsForm from "../TicketsForm/TicketsForm.tsx";
import { useCurrentUserQuery } from "../../redux/user/users_api.ts";
import { useSelector } from "react-redux";
import { selectUserRole } from "../../redux/auth/auth_selector.ts";
import TicketsFormEdit from "../TicketsFormEdit/TicketsFormEdit.tsx";
import {toast} from "react-toastify";
import {useDeleteEventMutation} from "../../redux/admin/admin_api.ts";

const EventInfo = () => {
    const navigate = useNavigate();
    const { data: eventsData, error: eventsError, isLoading: eventsLoading } = useFetchEventsQuery();
    const { data: categoriesData } = useFetchCategoriesQuery();
    const { data: userData } = useCurrentUserQuery();
    const [deleteEvent] = useDeleteEventMutation();
    const { eventId } = useParams<{ eventId: string }>();
    const [isBookFormVisible, setIsBookFormVisible] = useState(false);
    const [isEditFormVisible, setIsEditFormVisible] = useState(false);

    const currentUser = useSelector(selectUserRole);
    const isAdmin = currentUser === 'admin';

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

    const handleBookClick = () => {
        setIsBookFormVisible(true);
        setIsEditFormVisible(false);
    };

    const handleEditClick = () => {
        setIsEditFormVisible(true);
        setIsBookFormVisible(false);
    };

    const handleDeleteClick = async (e: MouseEventHandler<HTMLButtonElement>) => {
        if (!isAdmin) {
            toast.error('You do not have permission to delete events.', {
                autoClose: 2000,
            });
            return;
        }

        try {
            await deleteEvent({event_id: Number(eventId)}).unwrap();

            toast.success('Event deleted successfully!', {
                autoClose: 2000,
            });
            navigate('/')
            window.location.reload()
        } catch (err: any) {
            toast.error('Something went wrong', {
                autoClose: 2000,
            });
        }
    };

    return (
        <>
            {eventsError && <p>Error</p>}
            {eventsLoading && <p>Loading...</p>}
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
                        <button className={`event-info__button ${isBookFormVisible ? 'event-info__button-disabled' : ''}`}
                                type='button' disabled={isBookFormVisible} onClick={handleBookClick}>
                            Book ticket
                        </button>
                        {isAdmin && (
                            <button className={`event-info__button ${isEditFormVisible ? 'event-info__button-disabled' : ''}`}
                                    type='button' disabled={isEditFormVisible} onClick={handleEditClick}>
                                Edit Event
                            </button>
                        )}
                        {isAdmin && (
                            <button className={`event-info__button`}
                                    type='button' onClick={handleDeleteClick}>
                                Delete Event
                            </button>
                        )}
                    </div>
                </div>
            )}
            {isBookFormVisible && !isEditFormVisible && eventId && userData && (
                <div className='event-info-center'>
                    <TicketsForm eventId={eventId} userData={userData} availableTicketsState={availableTicketsState}
                                 setAvailableStateTickets={setAvailableStateTickets} />
                </div>
            )}
            {isEditFormVisible && !isBookFormVisible && eventId && userData && (
                <div className='event-info-center'>
                    <TicketsFormEdit eventById={eventById} categoryName={categoryName} />
                </div>
            )}
        </>
    );
};

export default EventInfo;
