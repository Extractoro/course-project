import {useFetchCategoriesQuery, useFetchEventsQuery} from "../../redux/fetch/fetch_api.ts";
import './Events.scss'
import {EventData} from "../../interfaces/fetch/EventResponse.ts";
import {Link} from "react-router-dom";
import {FaXmark} from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";
import {useEffect, useState} from "react";

const Events = () => {
    const { data: eventsData, error: eventsError, isLoading: eventsLoading } = useFetchEventsQuery();
    const { data: categoriesData } = useFetchCategoriesQuery();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1200) {
                setIsMenuOpen(false);
                document.body.classList.remove('no-scroll');
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);

        if (!isMenuOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    };

    const formatCategory = (category: string): string => {
        return category.split('_')
            .map(word => word.charAt(0)
                .toUpperCase() + word.slice(1))
            .join(' ');
    }

    return (
        <>
            {eventsLoading && <p>Error</p>}
            {eventsError && <p>Loading...</p>}
            {eventsData && eventsData?.data?.length > 0 ? (
                <>
                    <div className='events' id='events'>
                        <div className='events-background'>
                            <form className='events-background--container'>
                                <input className='events-background--input' type='text' placeholder='City'/>
                                <input className='events-background--input venue' type='text' placeholder='Venue name'/>
                                <input className='events-background--input' type='date'
                                       min={new Date().toISOString().split('T')[0]}/>
                                {/*<button className='events-background--button' type='submit'>Search</button>*/}
                            </form>
                        </div>
                        <div className="events__profile">
                            <div className="events__profile-menu">
                                <button onClick={toggleMenu} className="events__profile-button">
                                    {isMenuOpen ? (
                                        <FaXmark className="events__menu-icon events__menu-icon--close"/>
                                    ) : (
                                        <IoIosArrowForward className="events__menu-icon events__menu-icon--open"/>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className={`events-menu ${isMenuOpen ? "events-menu--open" : "events-menu--closed"}`}>
                            <select className='events-background--input-filter category-select'>
                                <option value="" selected disabled hidden>Choose category</option>
                                {categoriesData && categoriesData?.data?.map((category: any) => (
                                    <option key={category.category_id}
                                            value={category.category_name}>{category.category_name}</option>
                                ))}
                            </select>
                            <input className='events-background--input-filter' type='text' placeholder='Address'/>
                            <input className='events-background--input-filter' type='number' placeholder='Min ticket price'/>
                            <label className='events-background--input-filter--label'>Available tickets
                                <input className='events-background--input-filter category-checkbox' type='checkbox' placeholder='Available tickets'/>
                            </label>
                        </div>
                        <div className='events-list' id='events-list'>
                            {eventsData?.data?.map((event: EventData) => (
                                <Link to={`/events/${event.event_id}`} className="event-card" key={event.event_id}>
                                    <div className="event-card__image">
                                        {/* Место для картинки */}
                                    </div>
                                    <div className="event-card__content">
                                        <h2 className="event-card__title">{event.event_name}</h2>
                                        <div className='event-card__text'>
                                            <p className="event-card__category">{formatCategory(event.category)}</p>
                                            <p className="event-card__date">{new Date(event.event_date).toLocaleDateString()}</p>
                                        </div>
                                        <p className="event-card__description">{event.description || "No description provided."}</p>

                                        <div className="event-card__info">
                                            <div className="event-card__venue">
                                                <strong>Venue:</strong> {event.venue_name}, {event.city}, {event.address}
                                            </div>


                                        </div>

                                        <div className="event-card__actions">
                                            {/*<button className="event-card__button">See Details</button>*/}
                                            <button className="event-card__button">Buy Tickets</button>
                                            <div>
                                                <div className="event-card__tickets">
                                                    <strong>Tickets:</strong> {event.available_tickets > 0 ? `${event.available_tickets} available` : 'Sold out'}
                                                </div>
                                                <div className="event-card__price">
                                                    <strong>Price:</strong> ${event.ticket_price}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <p>No events found.</p>
            )}
        </>
    );
};

export default Events;