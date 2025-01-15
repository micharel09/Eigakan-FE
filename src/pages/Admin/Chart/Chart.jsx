import React, { useState } from 'react';
import ApexCharts from "react-apexcharts";

const MyChart = () => {
  const [chartData] = useState({
    series: [
      {
        name: 'Income',
        data: [18000, 51000, 60000, 38000, 88000, 50000, 40000, 52000, 88000, 80000, 60000, 70000],
      },
      {
        name: 'Outcome',
        data: [27000, 38000, 60000, 77000, 40000, 50000, 49000, 29000, 42000, 27000, 42000, 50000],
      },
    ],
    options: {
      chart: {
        type: 'area',
        height: 300,
      },
      xaxis: {
        categories: [
          '25 January 2023',
          '26 January 2023',
          '27 January 2023',
          '28 January 2023',
          '29 January 2023',
          '30 January 2023',
          '31 January 2023',
          '1 February 2023',
          '2 February 2023',
          '3 February 2023',
          '4 February 2023',
          '5 February 2023',
        ],
      },
    },
  });

  return (
    <div className=' mt-10 transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl  dark:border-neutral-700 dark:shadow-neutral-700/70 w-full '>
      <ApexCharts options={chartData.options} series={chartData.series} type="area" height={400} />
    </div>
  );
};

export default MyChart;
