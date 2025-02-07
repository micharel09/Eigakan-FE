import React from "react";
import MyChart from "../../Admin/Chart/Chart";

const ManagerDashboard = () => {
  return (
    <div className="">
      <div className="flex justify-between flex-wrap gap-4">
        {/*CARD HERE*/}
        <div className="max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">
          <div className="flex flex-col items-center justify-center p-4 md:p-5">
            <h3 className="text-lg font-bold text-black">50</h3>
            <p className="mt-2 text-gray-500 dark:text-neutral-400">
              Total Movies
            </p>
          </div>
        </div>

        <div className="max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">
          <div className="flex flex-col items-center justify-center p-4 md:p-5">
            <h3 className="text-lg font-bold text-black">25</h3>
            <p className="mt-2 text-gray-500 dark:text-neutral-400">
              Active Movies
            </p>
          </div>
        </div>

        <div className="max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">
          <div className="flex flex-col items-center justify-center p-4 md:p-5">
            <h3 className="text-lg font-bold text-black">100</h3>
            <p className="mt-2 text-gray-500 dark:text-neutral-400">
              Total Views
            </p>
          </div>
        </div>

        <div className="max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">
          <div className="flex flex-col items-center justify-center p-4 md:p-5">
            <h3 className="text-lg font-bold text-black">4.5</h3>
            <p className="mt-2 text-gray-500 dark:text-neutral-400">
              Avg Rating
            </p>
          </div>
        </div>
      </div>

      <MyChart />
    </div>
  );
};

export default ManagerDashboard;
