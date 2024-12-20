import {ChangeEvent, FormEvent, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {useCreateEventMutation} from "../../redux/admin/admin_api.ts";
import {useFetchCategoriesQuery} from "../../redux/fetch/fetch_api.ts";
import './EventAddEvent.scss'
import {useSelector} from "react-redux";
import {selectUserRole} from "../../redux/auth/auth_selector.ts";
import {useNavigate} from "react-router-dom";

const EventAddForm = () => {
    const navigate = useNavigate();
    const [createEvent] = useCreateEventMutation();
    const {data: categoriesData, isLoading: categoriesLoading, isError: categoriesError} = useFetchCategoriesQuery();

    const currentUser = useSelector(selectUserRole);
    const isAdmin = currentUser === 'admin';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/')
        }
    }, []);

    const [formData, setFormData] = useState({
        venueName: '',
        address: '',
        city: '',
        capacity: 1,
        eventName: '',
        eventDate: '',
        category: '',
        description: '',
        ticketPrice: 0,
        availableTickets: 1,
        isAvailable: true,
        isRecurring: false,
        frequency: '',
        repeat_interval: 1,
        start_date: '',
        end_date: ''
    });

    const formFields = [
        {name: 'venueName', label: 'Venue Name *', type: 'text', required: true},
        {name: 'address', label: 'Address *', type: 'text', required: true},
        {name: 'city', label: 'City *', type: 'text', required: true},
        {name: 'capacity', label: 'Capacity *', type: 'number', min: 1, required: true},
        {name: 'eventName', label: 'Event Name *', type: 'text', required: true},
        {name: 'eventDate', label: 'Event Date *', type: 'date', minDate: new Date().toISOString().split('T')[0], required: true},
        {name: 'description', label: 'Description', type: 'text', required: false},
        {name: 'ticketPrice', label: 'Ticket Price *', type: 'number', min: 0, required: true},
        {name: 'availableTickets', label: 'Available Tickets *', type: 'number', min: 1, required: true}
    ];

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: name === 'capacity' || name === 'ticketPrice' || name === 'availableTickets' ? Number(value) : value
        }));
    };

    const handleToggleAvailability = () => {
        setFormData((prevData) => ({
            ...prevData,
            isAvailable: !prevData.isAvailable
        }));
    };

    const handleToggleRecurring = () => {
        setFormData((prevData) => ({
            ...prevData,
            isRecurring: !prevData.isRecurring
        }));
    };

    const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setFormData((prevData) => ({
            ...prevData,
            category: e.target.value
        }));
    };

    const validateRecurringEvent = () => {
        const { frequency, repeat_interval, start_date, end_date } = formData;

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        let maxOccurrences = 0;

        switch (frequency) {
            case 'daily':
                maxOccurrences = Math.floor((endDate.getTime() - startDate.getTime()) / (repeat_interval * 24 * 60 * 60 * 1000));
                break;
            case 'weekly':
                maxOccurrences = Math.floor((endDate.getTime() - startDate.getTime()) / (repeat_interval * 7 * 24 * 60 * 60 * 1000));
                break;
            case 'monthly':
                maxOccurrences = Math.floor((endDate.getFullYear() - startDate.getFullYear()) * 12 / repeat_interval + (endDate.getMonth() - startDate.getMonth()) / repeat_interval);
                break;
            default:
                return true;
        }

        if (maxOccurrences <= 0) {
            toast.error("The recurrence interval does not fit within the specified date range.", {
                autoClose: 2000,
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isAdmin) {
            toast.error('You do not have permission to create events.', {
                autoClose: 2000,
            });
            return;
        }

        if (!validateRecurringEvent()) {
            return;
        }

        if (formData.availableTickets > formData.capacity) {
            toast.error('Available tickets cannot exceed venue capacity!', {
                autoClose: 2000,
            });
            return;
        }

        const eventPayload = {
            venue_name: formData.venueName,
            address: formData.address,
            city: formData.city,
            capacity: formData.capacity,
            event_name: formData.eventName,
            event_date: formData.eventDate,
            category: formData.category,
            description: formData.description,
            ticket_price: formData.ticketPrice,
            available_tickets: formData.availableTickets,
            isAvailable: formData.isAvailable,
            isRecurring: formData.isRecurring,
            frequency: formData.frequency,
            repeat_interval: formData.repeat_interval,
            start_date: formData.start_date,
            end_date: formData.end_date
        };

        try {
            await createEvent(eventPayload);

            toast.success('Event created successfully!', {
                autoClose: 2000,
            });
            resetForm();
        } catch (err: any) {
            const errorMessage =
                (err as any)?.message ||
                (err as any)?.data?.message ||
                'An unexpected error occurred.';

            toast.error(`${errorMessage}`, {
                autoClose: 2000,
            });
        }
    };

    const resetForm = () => {
        setFormData({
            venueName: '',
            address: '',
            city: '',
            capacity: 1,
            eventName: '',
            eventDate: '',
            category: '',
            description: '',
            ticketPrice: 0,
            availableTickets: 1,
            isAvailable: true,
            isRecurring: false,
            frequency: '',
            repeat_interval: 1,
            start_date: '',
            end_date: ''
        });
    };

    return (
        <>
            {!isAdmin ?
                <div className='eventAdd-form--container'>
                    <p>You are not an admin!</p>
                </div> : (<div className='eventAdd-form--container'>
                    <form className='eventAdd-form__form' onSubmit={handleSubmit}>
                        {formFields.map((field) => (
                            <div className='eventAdd-form__form-container' key={field.name}>
                                <label className='eventAdd-form__form-label' htmlFor={field.name}>
                                    {field.label}
                                </label>
                                <input
                                    className='eventAdd-form__form-input'
                                    type={field.type}
                                    id={field.name}
                                    name={field.name}
                                    value={formData[field.name as keyof typeof formData] as string | number}
                                    onChange={handleChange}
                                    {...(field.min !== undefined ? {min: field.min} : {})}
                                    {...(field.minDate ? {min: field.minDate} : {})}
                                    {...(field.required) ? {required: field.required} : {}}
                                />
                            </div>
                        ))}

                        <div className='eventAdd-form__form-container'>
                            <label className='eventAdd-form__form-label' htmlFor="category">Category</label>
                            {categoriesLoading ? (
                                <p>Loading categories...</p>
                            ) : categoriesError ? (
                                <p>Error loading categories</p>
                            ) : (
                                <select
                                    className='eventAdd-form__form-input'
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleCategoryChange}
                                    required
                                >
                                    <option value="" disabled>
                                        -- Select a category --
                                    </option>
                                    {categoriesData?.data.map((category: any) => (
                                        <option key={category.category_id} value={category.category_name}>
                                            {category.category_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className='eventAdd-form__form-container'>
                            <label className='eventAdd-form__form-label'>
                                Are sales available? :
                                <button
                                    type="button"
                                    className={`eventAdd-form__toggle-button ${formData.isAvailable ? 'active' : ''}`}
                                    onClick={handleToggleAvailability}
                                >
                                    {formData.isAvailable ? 'On' : 'Off'}
                                </button>
                            </label>
                        </div>

                        <div className='eventAdd-form__form-container'>
                            <label className='eventAdd-form__form-label'>
                                Is recurring? :
                                <button
                                    type="button"
                                    className={`eventAdd-form__toggle-button ${formData.isRecurring ? 'active' : ''}`}
                                    onClick={handleToggleRecurring}
                                >
                                    {formData.isRecurring ? 'Yes' : 'No'}
                                </button>
                            </label>
                        </div>

                        {formData.isRecurring && (
                            <>
                                <div className='eventAdd-form__form-container'>
                                    <label className='eventAdd-form__form-label'>Frequency</label>
                                    <select
                                        name="frequency"
                                        value={formData.frequency}
                                        onChange={handleChange}
                                        required
                                        className="eventAdd-form__form-input"
                                    >
                                        <option value="" disabled>-- Select frequency --</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div className='eventAdd-form__form-container'>
                                    <label className='eventAdd-form__form-label'>Repeat Interval</label>
                                    <input
                                        type="number"
                                        name="repeat_interval"
                                        value={formData.repeat_interval}
                                        min="1"
                                        className="eventAdd-form__form-input"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className='eventAdd-form__form-container'>
                                    <label className='eventAdd-form__form-label'>Start Date</label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        className="eventAdd-form__form-input"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                                <div className='eventAdd-form__form-container'>
                                    <label className='eventAdd-form__form-label'>End Date</label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        className="eventAdd-form__form-input"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <button className='eventAdd-form__form-button' type="submit">Create Event</button>
                    </form>
                </div>)
            }

        </>

    );
};

export default EventAddForm;
