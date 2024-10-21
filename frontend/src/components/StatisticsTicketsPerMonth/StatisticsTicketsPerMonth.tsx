import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TicketsPerMonthChartProps {
    ticketCountsByMonth: number[];
}

const TicketsPerMonthChart: React.FC<TicketsPerMonthChartProps> = ({ ticketCountsByMonth }) => {
    const chartData = {
        labels: Object.keys(ticketCountsByMonth),
        datasets: [
            {
                label: 'Number of tickets purchased',
                data: Object.values(ticketCountsByMonth),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    return <Bar data={chartData} />;
};

export default TicketsPerMonthChart;
