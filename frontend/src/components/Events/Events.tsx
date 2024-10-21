import { useFetchCategoriesQuery, useFetchEventsQuery } from "../../redux/fetch/fetch_api.ts";
import './Events.scss';
import { EventData } from "../../interfaces/fetch/EventResponse.ts";
import { CategoriesData } from "../../interfaces/fetch/CategoryResponse.ts";
import {Link, useNavigate} from "react-router-dom";
import { FaXmark } from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";
import {ChangeEvent, useEffect, useState} from "react";
import { DateTime } from 'luxon';
import {useSelector} from "react-redux";
import {selectUserRole} from "../../redux/auth/auth_selector.ts";

const Events = () => {
    const navigate = useNavigate();
    const { data: eventsData, error: eventsError, isLoading: eventsLoading } = useFetchEventsQuery();
    const { data: categoriesData } = useFetchCategoriesQuery();
    const [cityFilter, setCityFilter] = useState('');
    const [venueNameFilter, setVenueNameFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [addressFilter, setAddressFilter] = useState('');
    const [minPriceFilter, setMinPriceFilter] = useState('');
    const currentUser = useSelector(selectUserRole);
    const isAdmin = currentUser === 'admin';

    const filteredEvents = eventsData?.data?.filter((event: EventData) => {
        const matchesCity = cityFilter ? event.city.toLowerCase().includes(cityFilter.toLowerCase()) : true;
        const matchesVenueName = venueNameFilter ? event.venue_name.toLowerCase().includes(venueNameFilter.toLowerCase()) : true;

        const eventDateKiev = DateTime.fromISO(event.event_date, { zone: 'utc' }).setZone('Europe/Kiev').toISODate();
        const matchesDate = dateFilter ? eventDateKiev === dateFilter : true;

        const categoryName = categoriesData?.data?.find((category: CategoriesData) => category.category_id === event.category_id)?.category_name || '';
        const matchesCategory = categoryFilter ? categoryName.toLowerCase().includes(categoryFilter.toLowerCase()) : true;

        const matchesAddress = addressFilter ? event.address.toLowerCase().includes(addressFilter.toLowerCase()) : true;
        const matchesMinPrice = minPriceFilter ? event.ticket_price <= Number(minPriceFilter) : true;

        return matchesCity && matchesVenueName && matchesDate && matchesCategory && matchesAddress && matchesMinPrice;
    }) ?? [];

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

    // Перенаправление для админа, если нет событий
    useEffect(() => {
        console.log({
            eventsLoading,
            eventsError,
            eventsData: eventsData?.data.length,
            isAdmin,
        });

        if (!eventsLoading && !eventsError && eventsData && eventsData.data.length === 0 && isAdmin) {
            navigate('/admin/create_event');
        }
    }, [eventsLoading, eventsError, eventsData, isAdmin, navigate]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        document.body.classList.toggle('no-scroll', !isMenuOpen);
    };

    const formatCategory = (category: string): string => {
        return category?.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        switch (name) {
            case 'city':
                setCityFilter(value);
                break;
            case 'venue':
                setVenueNameFilter(value);
                break;
            case 'date':
                setDateFilter(value);
                break;
            case 'address':
                setAddressFilter(value);
                break;
            case 'minPrice':
                setMinPriceFilter(value);
                break;
            case 'category':
                setCategoryFilter(value);
                break;
            default:
                break;
        }
    };

    const handleAddEvent = () => {
        document.body.classList.remove('no-scroll');
        navigate('/admin/create_event')
    }

    return (
        <>
            {eventsLoading && <p>Loading events... Please wait.</p>}
            {eventsError && <p>Error loading events. Please try again later.</p>}
            {eventsData && eventsData.data.length > 0 ? (
                <div className='events' id='events'>
                    <div className='events-background'>
                        <form className='events-background--container'>
                            <input
                                className='events-background--input'
                                type='text'
                                name='city'
                                placeholder='City'
                                value={cityFilter}
                                onChange={handleInputChange}
                            />
                            <input
                                className='events-background--input venue'
                                type='text'
                                name='venue'
                                placeholder='Venue name'
                                value={venueNameFilter}
                                onChange={handleInputChange}
                            />
                            <input
                                className='events-background--input'
                                type='date'
                                name='date'
                                min={new Date().toISOString().split('T')[0]}
                                value={dateFilter}
                                onChange={handleInputChange}
                            />
                        </form>
                    </div>
                    <div className="events__profile">
                        <div className="events__profile-menu">
                            <button onClick={toggleMenu} className="events__profile-button">
                                {isMenuOpen ? (
                                    <FaXmark className="events__menu-icon events__menu-icon--close" />
                                ) : (
                                    <IoIosArrowForward className="events__menu-icon events__menu-icon--open" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className={`events-menu ${isMenuOpen ? "events-menu--open" : "events-menu--closed"}`}>
                        <select className='events-background--input-filter category-select' value={categoryFilter}
                                onChange={handleInputChange} name='category'>
                            <option value="" disabled>
                                -- Select a category --
                            </option>
                            {categoriesData && categoriesData.data.map((category: any) => (
                                <option key={category.category_id}
                                        value={category.category_name}>{category.category_name}</option>
                            ))}
                        </select>

                        <input
                            className='events-background--input-filter'
                            type='text'
                            name='address'
                            placeholder='Address'
                            value={addressFilter}
                            onChange={handleInputChange}
                        />

                        <input
                            className='events-background--input-filter'
                            type='number'
                            name='minPrice'
                            placeholder='Min ticket price'
                            value={minPriceFilter}
                            onChange={handleInputChange}
                        />

                        {isAdmin &&
                            <button className="event-card__button-add" onClick={handleAddEvent}>Add ticket</button>}
                    </div>

                    <div className='events__container--desktop'>
                        <div className='events-menu--desktop'>
                            <select className='events-background--input-filter category-select' value={categoryFilter}
                                    onChange={handleInputChange} name='category'>
                                <option value="" disabled>
                                    -- Select a category --
                                </option>
                                {categoriesData && categoriesData.data.map((category: any) => (
                                    <option key={category.category_id}
                                            value={category.category_name}>{category.category_name}</option>
                                ))}
                            </select>

                            <input
                                className='events-background--input-filter'
                                type='text'
                                name='address'
                                placeholder='Address'
                                value={addressFilter}
                                onChange={handleInputChange}
                            />

                            <input
                                className='events-background--input-filter'
                                type='number'
                                name='minPrice'
                                placeholder='Min ticket price'
                                value={minPriceFilter}
                                onChange={handleInputChange}
                            />

                            {isAdmin &&
                                <button className="event-card__button-add" onClick={handleAddEvent}>Add ticket</button>}
                        </div>
                        <div className='events-list' id='events-list'>
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event: EventData) => {
                                    const categoryName = categoriesData?.data?.find((category: CategoriesData) => category.category_id === event.category_id)?.category_name || '';
                                    return (
                                        <Link to={`/events/${event.event_id}`} className="event-card" key={event.event_id}>
                                            <div className="event-card__image">
                                                {/* Место для картинки */}
                                            </div>
                                            <div className="event-card__content">
                                                <h2 className="event-card__title">{event.event_name}</h2>
                                                <div className='event-card__text'>
                                                    <p className="event-card__category">{formatCategory(categoryName)}</p>
                                                    <p className="event-card__date">{new Date(event.event_date).toLocaleDateString()}</p>
                                                </div>
                                                <p className="event-card__description">{event.description || "No description provided."}</p>

                                                <div className="event-card__info">
                                                    <div className="event-card__venue">
                                                        <strong>Venue:</strong> {event.venue_name}, {event.city}, {event.address}
                                                    </div>
                                                </div>

                                                <div className="event-card__actions">
                                                    <button className="event-card__button">Book Tickets</button>
                                                    <div>
                                                        <div className="event-card__tickets">
                                                            <strong>Tickets:</strong> {event.available_tickets > 0 ? `${event.available_tickets} available` : 'Sold out'}
                                                        </div>
                                                        <div className="event-card__price">
                                                            <strong>Price:</strong> {event.ticket_price} UAH
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <p>No events found.</p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <p>No events found.</p>
            )}
        </>
    );
};

export default Events;
