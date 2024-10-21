import Header from "../../components/Header/Header.tsx";
import Container from "../../components/Container/Container.tsx";
import { useFetchCategoriesQuery, useFetchEventsQuery } from "../../redux/fetch/fetch_api.ts";
import { useGetAllTicketsQuery, useGetAllUsersQuery } from "../../redux/admin/admin_api.ts";
import StatisticsPopularCategories from "../../components/StatisticsPopularCategories/StatisticsPopularCategories.tsx";
import { AdminTicketDataInterface } from "../../interfaces/admin/admin_interface.ts";
import { useEffect, useState } from "react";
import './Statistics.scss';
import StatisticsTicketsPerMonth from "../../components/StatisticsTicketsPerMonth/StatisticsTicketsPerMonth.tsx";

const Statistics = () => {
    const { data: categoriesData, error: categoriesError, isLoading: categoriesLoading } = useFetchCategoriesQuery();
    const { data: eventsData, error: eventsError, isLoading: eventsLoading } = useFetchEventsQuery();
    const { data: usersData, error: usersError, isLoading: usersLoading } = useGetAllUsersQuery();
    const { data: ticketsData, error: ticketsError, isLoading: ticketsLoading, refetch: refetchTickets } = useGetAllTicketsQuery();

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const [verificationRate, setVerificationRate] = useState<number | null>(null);
    const [averageTicketPriceInfo, setAverageTicketPriceInfo] = useState<{ average: number | null, mostExpensive: string | null, cheapest: string | null }>({ average: null, mostExpensive: null, cheapest: null });
    const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
    const [ticketCountsByMonth, setTicketCountsByMonth] = useState<Record<string, number>>({});
    const [averagePricesByCategory, setAveragePricesByCategory] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (ticketsData?.data) {
            const categoryData: { [key: string]: { total: number, count: number } } = {};
            const monthCounts: Record<string, number> = {};
            let totalPrice = 0;

            ticketsData.data.forEach((ticket: AdminTicketDataInterface) => {
                const category = ticket.category_name;
                if (category) {
                    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                    categoryData[category] = {
                        total: (categoryData[category]?.total || 0) + ticket.ticket_price,
                        count: (categoryData[category]?.count || 0) + 1
                    };
                }

                const month = months[new Date(ticket.event_date).getMonth()];
                monthCounts[month] = (monthCounts[month] || 0) + 1;

                totalPrice += ticket.ticket_price;
            });

            const averages: { [key: string]: number } = {};
            let maxPrice = -Infinity;
            let minPrice = Infinity;
            let mostExpensiveCategory = null;
            let cheapestCategory = null;

            for (const [category, { total, count }] of Object.entries(categoryData)) {
                const averagePrice = total / count;
                averages[category] = averagePrice;

                if (averagePrice > maxPrice) {
                    maxPrice = averagePrice;
                    mostExpensiveCategory = category;
                }

                if (averagePrice < minPrice) {
                    minPrice = averagePrice;
                    cheapestCategory = category;
                }
            }

            setCategoryCounts(categoryCounts);
            setTicketCountsByMonth(monthCounts);
            setAveragePricesByCategory(averages);
            setAverageTicketPriceInfo({
                average: totalPrice / ticketsData.data.length,
                mostExpensive: mostExpensiveCategory,
                cheapest: cheapestCategory
            });
        }
    }, [ticketsData]);

    useEffect(() => {
        if (usersData) {
            const totalUsers = usersData.data.length;
            const verifiedUsers = usersData.data.filter(user => user.verify === 1).length;
            const percentage = totalUsers ? (verifiedUsers / totalUsers) * 100 : 0;
            setVerificationRate(percentage);
        }
    }, [usersData]);

    useEffect(() => {
        refetchTickets();
    }, [refetchTickets]);

    return (
        <>
            <Header />
            <Container>
                {ticketsLoading || categoriesLoading ? (
                    <p>Loading...</p>
                ) : ticketsError || categoriesError ? (
                    <p>Error loading data</p>
                ) : (
                    <div className='statistics-center'>
                        <div className='statistics'>
                            <div className='statistics__item'>
                                <h3 className='statistics__item-title'>Popular categories from purchased tickets</h3>
                                <StatisticsPopularCategories categoryCounts={categoryCounts} />
                            </div>
                            <div className='statistics__item'>
                                <h3 className='statistics__item-title'>Number of tickets purchased by event month</h3>
                                <StatisticsTicketsPerMonth ticketCountsByMonth={months.map(month => ticketCountsByMonth[month] || 0)} />
                            </div>
                            <div className='statistics__item'>
                                <h3 className='statistics__item-title'>Percentage of users who confirmed their email: {verificationRate !== null ? verificationRate.toFixed(2) + '%' : 'N/A'}</h3>
                            </div>
                            <div className='statistics__item'>
                                <h3 className='statistics__item-title'>Average ticket price for all events: {averageTicketPriceInfo.average !== null ? averageTicketPriceInfo.average.toFixed(2) + ' UAH' : 'N/A'}</h3>
                            </div>
                            <div className='statistics__item'>
                                <h3 className='statistics__item-title'>Average price of purchased tickets by category:</h3>
                                <ul>
                                    {Object.entries(averagePricesByCategory).map(([category, average]) => (
                                        <li key={category}>
                                            {category}: {average.toFixed(2)} UAH
                                        </li>
                                    ))}
                                </ul>
                                <h4>
                                    The most expensive category: {averageTicketPriceInfo.mostExpensive} (
                                    {averageTicketPriceInfo.mostExpensive && averagePricesByCategory[averageTicketPriceInfo.mostExpensive] ? averagePricesByCategory[averageTicketPriceInfo.mostExpensive].toFixed(2) : 'N/A'} UAH)
                                </h4>
                                <h4>
                                    The cheapest category: {averageTicketPriceInfo.cheapest} (
                                    {averageTicketPriceInfo.cheapest && averagePricesByCategory[averageTicketPriceInfo.cheapest] ? averagePricesByCategory[averageTicketPriceInfo.cheapest].toFixed(2) : 'N/A'} UAH)
                                </h4>
                            </div>
                        </div>
                    </div>
                )}
            </Container>
        </>
    );
};

export default Statistics;
