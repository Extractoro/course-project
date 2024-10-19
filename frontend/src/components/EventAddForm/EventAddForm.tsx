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
    const {data: categoriesData, isLoading: categoriesLoading, isError: categoriesError} = useFetchCategoriesQuery(); // Запрос категорий

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
        availableTickets: 1
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

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: name === 'capacity' || name === 'ticketPrice' || name === 'availableTickets' ? Number(value) : value
        }));
    };

    const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setFormData((prevData) => ({
            ...prevData,
            category: e.target.value
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isAdmin) {
            toast.error('You do not have permission to create events.', {
                autoClose: 2000,
            });
            return;
        }

        try {
            await createEvent({
                venue_name: formData.venueName,
                address: formData.address,
                city: formData.city,
                capacity: formData.capacity,
                event_name: formData.eventName,
                event_date: formData.eventDate,
                category: formData.category,
                description: formData.description,
                ticket_price: formData.ticketPrice,
                available_tickets: formData.availableTickets
            }).unwrap();

            toast.success('Event created successfully!', {
                autoClose: 2000,
            });
            resetForm();
        } catch (err: any) {
            toast.error('Something went wrong', {
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
            availableTickets: 1
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
                                    value={formData[field.name as keyof typeof formData]}
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

                        <button className='eventAdd-form__form-button' type="submit">Create Event</button>
                    </form>
                </div>)
            }

        </>

    );
};

export default EventAddForm;
