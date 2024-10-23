import { useReturnTicketsMutation } from "../../redux/tickets/tickets_api.ts";
import { UsersResponse } from "../../interfaces/users/UsersResponse.ts";
import {ChangeEvent, FC, FormEvent, useState} from "react";
import { UserTicketsResponse } from "../../interfaces/fetch/UserTicketsResponse.ts";
import './TicketsReturnForm.scss'
import {toast} from "react-toastify";
import {DateTime} from "luxon";

type TicketsReturnFormProps = {
    userInfo: UsersResponse;
    ticketsInfo: UserTicketsResponse | undefined;
}

const TicketsReturnForm: FC<TicketsReturnFormProps> = ({ userInfo, ticketsInfo }) => {
    const [returnTickets] = useReturnTicketsMutation();
    const [quantity, setQuantity] = useState<number>(1);
    const [event_id, setEventId] = useState<string>('');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const userTickets = ticketsInfo?.data.filter(ticket => ticket.event_id === Number(event_id)) || [];
        const totalUserTickets = userTickets.length;

        if (quantity > totalUserTickets) {
            toast.error(`You cannot return more tickets than you have. You have ${totalUserTickets} tickets for this event.`, {
                autoClose: 2000,
            });
            return;
        }

        try {
            await returnTickets({ user_id: userInfo.results[0].user_id, event_id, quantity }).unwrap();
            toast.success("Tickets returned successfully!", {
                autoClose: 2000,
            });
            window.location.reload();
        } catch (error) {
            toast.error("Failed to return tickets. Please try again.", {
                autoClose: 2000,
            });
        }
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        switch (name) {
            case 'quantity':
                setQuantity(Number(value));
                break;
            case 'eventId':
                setEventId(String(value));
                break;
            default:
                return;
        }
    };

    const uniqueEvents = ticketsInfo ? Array.from(new Set(ticketsInfo.data.map(ticket => ticket.event_id)))
            .map(eventId => {
                const ticket = ticketsInfo.data.find(t => t.event_id === eventId);
                return {
                    event_id: eventId,
                    event_name: ticket?.event_name || 'Неизвестное событие',
                    event_date: ticket?.event_date,
                };
            })
            .filter(event => {
                const eventDate = DateTime.fromISO(event.event_date as string, { zone: 'utc' });
                return eventDate > DateTime.now();
            })
        : [];

    return (
        <form className='tickets-return__form' onSubmit={handleSubmit}>
            <div className='tickets-return__form-container'>
                <label className='tickets-return__form-label' htmlFor="eventId">Event ID</label>
                <select className='tickets-return__form-input' onChange={handleChange} name="eventId" id="eventId" value={event_id} required>
                    <option value="" disabled selected>Выберите событие</option>
                    {uniqueEvents.map(event => (
                        <option key={event.event_id} value={event.event_id}>
                            {event.event_name} (ID: {event.event_id})
                        </option>
                    ))}
                </select>
            </div>
            <div className='tickets-return__form-container'>
                <label className='tickets-return__form-label' htmlFor="quantity">Quantity</label>
                <input className='tickets-return__form-input' onChange={handleChange} type="number" id="quantity"
                       name="quantity"
                       value={quantity} min={1} required
                       title="Quantity must be positive"/>
            </div>
            <button className='tickets-return__form-button' type="submit">Return tickets</button>
        </form>
    );
}

export default TicketsReturnForm;
