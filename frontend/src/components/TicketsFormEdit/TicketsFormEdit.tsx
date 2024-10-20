import {ChangeEvent, FC, FormEvent, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {useUpdateEventMutation} from "../../redux/admin/admin_api.ts";
import {useFetchCategoriesQuery} from "../../redux/fetch/fetch_api.ts";
import {useSelector} from "react-redux";
import {selectUserRole} from "../../redux/auth/auth_selector.ts";
import {useNavigate} from "react-router-dom";
import './TicketsFormEdit.scss'
import {EventData} from "../../interfaces/fetch/EventResponse.ts";

type TicketsFormEditProps = {
    eventById: EventData | undefined,
    categoryName: string
}

const TicketsFormEdit: FC<TicketsFormEditProps> = ({eventById, categoryName}) => {
    const navigate = useNavigate();
    const [updateEvent] = useUpdateEventMutation();
    const {data: categoriesData, isLoading: categoriesLoading, isError: categoriesError} = useFetchCategoriesQuery();

    const currentUser = useSelector(selectUserRole);
    const isAdmin = currentUser === 'admin';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/')
        }
    }, []);

    const [formData, setFormData] = useState({
        venueName: eventById?.venue_name || '',
        address: eventById?.address || '',
        city: eventById?.city || '',
        capacity: eventById?.capacity || 1,
        eventName: eventById?.event_name || '',
        eventDate: eventById?.event_date || '',
        category: categoryName || '',
        description: eventById?.description || '',
        ticketPrice: eventById?.ticket_price || 0,
        availableTickets: eventById?.available_tickets || 1
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
            toast.error('You do not have permission to edit events.', {
                autoClose: 2000,
            });
            return;
        }

        try {
            await updateEvent({
                venue_name: formData.venueName,
                address: formData.address,
                city: formData.city,
                capacity: formData.capacity,
                event_id: Number(eventById?.event_id),
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
            navigate('/')
            window.location.reload()
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
                <div className='eventEdit-form--container'>
                    <p>You are not an admin!</p>
                </div> : (<div className='eventEdit-form--container'>
                    <form className='eventEdit-form__form' onSubmit={handleSubmit}>
                        {formFields.map((field) => (
                            <div className='eventEdit-form__form-container' key={field.name}>
                                <label className='eventEdit-form__form-label' htmlFor={field.name}>
                                    {field.label}
                                </label>
                                <input
                                    className='eventEdit-form__form-input'
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

                        <div className='eventEdit-form__form-container'>
                            <label className='eventEdit-form__form-label' htmlFor="category">Category</label>
                            {categoriesLoading ? (
                                <p>Loading categories...</p>
                            ) : categoriesError ? (
                                <p>Error loading categories</p>
                            ) : (
                                <select
                                    className='eventEdit-form__form-input'
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

                        <button className='eventEdit-form__form-button' type="submit">Edit Event</button>
                    </form>
                </div>)
            }

        </>
    )
}
export default TicketsFormEdit
