import {ChangeEvent, FC, FormEvent, useState} from "react";
import {toast} from "react-toastify";
import {UsersResponse} from "../../interfaces/users/UsersResponse.ts";
import {useBookTicketsMutation} from "../../redux/tickets/tickets_api.ts";
import './TicketsForm.scss'
import {useFetchUserTicketsQuery} from "../../redux/fetch/fetch_api.ts";
import {UserTicketsData} from "../../interfaces/fetch/UserTicketsResponse.ts";

type TicketsFormProps = {
    eventId: string,
    userData: UsersResponse,
    availableTicketsState: number,
    setAvailableStateTickets: (updater: (prev: number) => number) => void;
}

const TicketsForm: FC<TicketsFormProps> = ({eventId, userData, availableTicketsState, setAvailableStateTickets}) => {
    const [bookTickets] = useBookTicketsMutation();
    const [quantity, setQuantity] = useState<number>(1);

    const userId = userData.results[0]?.user_id;

    const {data: userTicketsResponse, refetch: refetchUserTickets} = useFetchUserTicketsQuery({user_id: userId});

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        try {
            e.preventDefault();

            if (userData && userData.results && userData.results.length > 0 && availableTicketsState) {
                const userBookedTickets = userTicketsResponse?.data?.filter((ticket: UserTicketsData) =>
                    Number(ticket.event_id) === Number(eventId) && ticket.ticket_status === 'booked'
                ).length || 0;

                const totalTicketsAllowed = Math.max(Math.floor((availableTicketsState + userBookedTickets) * 0.05), 1);
                const remainingTicketsAllowed = totalTicketsAllowed - userBookedTickets;

                if (quantity > remainingTicketsAllowed) {
                    toast.error(`You can only book ${remainingTicketsAllowed} more tickets for this event.`, {
                        autoClose: 2000,
                    });
                    return;
                }

                await bookTickets({event_id: eventId, user_id: userId, quantity});

                setAvailableStateTickets(prev => prev - quantity);

                toast.success(`You successfully booked ${quantity} tickets.`, {
                    autoClose: 2000,
                });
                refetchUserTickets();

                reset();
            }
        } catch (err: any) {
            if (err.data?.message) {
                toast.error(`Something went wrong!`, {
                    autoClose: 2000,
                });
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        switch (name) {
            case 'quantity':
                setQuantity(Number(value));
                break;

            default:
                return;
        }
    };

    const reset = () => {
        setQuantity(1);
    };

    return (
        <div>
            <form className='tickets-form__form' onSubmit={handleSubmit}>
                <div className='tickets-form__form-container'>
                    <label className='tickets-form__form-label' htmlFor="quantity">Quantity</label>
                    <input className='tickets-form__form-input' onChange={handleChange} type="number" id="quantity"
                           name="quantity"
                           value={quantity} pattern=".{1}" min={1}
                           title="Quantity must be positive" required/>
                </div>
                <button className='tickets-form__form-button' type="submit">Book now</button>
            </form>
        </div>
    )
}
export default TicketsForm
