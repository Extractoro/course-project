import {useFetchEventsQuery} from "../../redux/fetch/fetch_api.ts";
import './Events.scss'

const Events = () => {
    const {data, error, isLoading} = useFetchEventsQuery()

    const formatCategory = (category: string): string => {
        return category.split('_')
            .map(word => word.charAt(0)
            .toUpperCase() + word.slice(1))
            .join(' ');
    }

    return (
        <>
            {error && <p>Error</p>}
            {isLoading && <p>Loading...</p>}
            {data && data?.data?.length > 0 ? (
                <>
                    <div className='events'>
                        <div className='events-background'>
                            <form className='events-background--container'>
                                <input className='events-background--input' type='text' placeholder='City'/>
                                <input className='events-background--input venue' type='text' placeholder='Venue name'/>
                                <input className='events-background--input' type='date'
                                       min={new Date().toISOString().split('T')[0]}/>
                                {/*<button className='events-background--button' type='submit'>Search</button>*/}
                            </form>
                        </div>
                        <div className='events-list'>
                            {data?.data?.map((event: any) => (
                                <div className="event-card">
                                    <div className="event-card__image">
                                        {/* Место для картинки */}
                                    </div>
                                    <div className="event-card__content">
                                        <h2 className="event-card__title">{event.event_name}</h2>
                                        <p className="event-card__category">{formatCategory(event.category)}</p>
                                        <p className="event-card__date">{new Date(event.event_date).toLocaleDateString()}</p>
                                        <p className="event-card__description">{event.description || ""}</p>

                                        <div className="event-card__info">
                                            <div className="event-card__venue">
                                                Venue: {event.venue_name}, {event.city}, {event.address}
                                            </div>
                                            <div className="event-card__tickets">
                                                Tickets: {event.available_tickets > 0 ? `${event.available_tickets} available` : 'Sold out'}
                                            </div>
                                            <div className="event-card__price">
                                                Price: ${event.ticket_price}
                                            </div>
                                        </div>

                                        <div className="event-card__actions">
                                            <button className="event-card__button">See Details</button>
                                            <button className="event-card__button--primary">Buy Tickets</button>
                                        </div>
                                    </div>
                                </div>

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