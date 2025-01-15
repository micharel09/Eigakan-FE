import React from "react";
import MyChart from "../Chart/Chart";


const Dashboard = () => {
return (
  <div className="">
  
  <div class="flex justify-between flex-wrap gap-4">
    {/*CARD HERE*/ }  
    <div class=" max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl  dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">  
      <div class="flex flex-col items-center justify-center p-4 md:p-5">
        <h3 class="text-lg font-bold text-black">50 </h3>
        <p class="mt-2 text-gray-500 dark:text-neutral-400"> User </p>
      </div>
    </div>
    
    <div class=" max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl  dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">  
      <div class="flex flex-col items-center justify-center p-4 md:p-5">
        <h3 class="text-lg font-bold text-black">50 </h3>
        <p class="mt-2 text-gray-500 dark:text-neutral-400"> User </p>
      </div>
    </div>

    <div class="max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl  dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">  
      <div class="flex flex-col items-center justify-center p-4 md:p-5">
        <h3 class="text-lg font-bold text-black">50 </h3>
        <p class="mt-2 text-gray-500 dark:text-neutral-400"> User </p>
      </div>
    </div> 

    <div class=" max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl  dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">  
      <div class="flex flex-col items-center justify-center p-4 md:p-5">
        <h3 class="text-lg font-bold text-black">50 </h3>
        <p class="mt-2 text-gray-500 dark:text-neutral-400"> User </p>
      </div>
    </div>
    
    <div class=" max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl  dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">  
      <div class="flex flex-col items-center justify-center p-4 md:p-5">
        <h3 class="text-lg font-bold text-black">50 </h3>
        <p class="mt-2 text-gray-500 dark:text-neutral-400"> User </p>
      </div>
    </div>

    <div class="max-w-xs transition duration-300 ease-in-out hover:shadow-lg dark:hover:shadow-black/30 flex flex-col bg-white border shadow-sm rounded-xl  dark:border-neutral-700 dark:shadow-neutral-700/70 w-full md:w-1/4">  
      <div class="flex flex-col items-center justify-center p-4 md:p-5">
        <h3 class="text-lg font-bold text-black">50 </h3>
        <p class="mt-2 text-gray-500 dark:text-neutral-400"> User </p>
      </div>
    </div> 
  </div>
  
    <MyChart  />
  </div>
  );
};

export default Dashboard;
