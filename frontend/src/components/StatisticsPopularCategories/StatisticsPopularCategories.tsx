import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import getPastelColors from "../../services/GenerateColor.ts";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryDoughnutChartProps {
    categoryCounts: Record<string, number>;
}

const CategoryDoughnutChart: React.FC<CategoryDoughnutChartProps> = ({ categoryCounts }) => {
    const chartData = {
        labels: Object.keys(categoryCounts),
        datasets: [
            {
                data: Object.values(categoryCounts),
                backgroundColor: getPastelColors(Object.keys(categoryCounts).length),
            },
        ],
    };

    return <Doughnut data={chartData} />;
};

export default CategoryDoughnutChart;
