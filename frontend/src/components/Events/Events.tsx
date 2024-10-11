import {useFetchEventsQuery} from "../../redux/fetch/fetch_api.ts";

const Events = () => {
    const {data, error, isLoading} = useFetchEventsQuery()

    return (
        <>
            {error && <p>Error</p>}
            {isLoading && <p>Loading...</p>}
            {data && data?.data?.length > 0 ? (
                <ul>
                    {data?.data?.map((event: any) => (
                        <li key={event.event_id}>
                            <h2>{event.event_name}</h2>
                            <p>{event.category}</p>
                            <p>{event.event_date}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No events found.</p> // Если нет данных, отображаем сообщение
            )}
        </>
    );
};

export default Events;