import React from 'react'

const User = () => {
  return (
    <div>
        <div className="flex flex-col">
  <div className="-m-1.5 overflow-x-auto">
    <div className="p-1.5 min-w-full inline-block align-middle">
      <div className="border rounded-lg divide-y divide-gray-200 dark:border-neutral-700 bg-white">
        <div className="py-3 px-4 flex justify-between">
          <div className="relative max-w-xs">
            {/* search  */}
            <label htmlFor="hs-table-search" className="sr-only">Search</label>
            <input 
                type="text" 
                name="hs-table-search" 
                id="hs-table-search" 
                className="py-2 px-3 ps-9 block w-full border rounded-lg text-sm focus:z-10  disabled:opacity-50 disabled:pointer-events-none dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 bg-white" 
                placeholder="Search for user"
            />  
            <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-3">
              <svg className="size-4 text-gray-400 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </div>
          </div>
          
          {/* Create button */}
          <button type="button" class="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg   bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-red-600 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700">
            Create
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
</svg>

        </button>
       
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="bg-slate-100 ">
              <tr>
                <th scope="col" className="py-3 px-4 pe-0">
                  <div className="flex items-center h-5">
                    <input id="hs-table-search-checkbox-all" type="checkbox" className="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-neutral-700 dark:border-neutral-500 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800"/>
                    <label htmlFor="hs-table-search-checkbox-all" className="sr-only">Checkbox</label>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-black uppercase ">Name</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-black uppercase ">Email</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-black uppercase ">Role</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-black uppercase ">Status</th>
                <th scope="col" className="px-6 py-3 text-end text-xs font-medium text-black uppercase ">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
            <tr>
                <td className="py-3 ps-4">
                <div className="flex items-center">
                    <img
                    src="https://scontent.fsgn5-5.fna.fbcdn.net/v/t39.30808-6/460444778_2246016819096224_360879061239387438_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=JTpjWe2uDpEQ7kNvgElg_n8&_nc_zt=23&_nc_ht=scontent.fsgn5-5.fna&_nc_gid=AofsnegJVaYNoVcWr9VGqsh&oh=00_AYAUoXZhQcCMFHObr0eu8FWCzNKg1t46ynEwWWsLrl35Vw&oe=678C3BF6" // Thay bằng đường dẫn avatar thật
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                    />
                </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800"><a href="">John Brown</a></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">t@gmail.com</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">admin</td>
                <div class="flex items-center px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        <div class="h-2.5 w-2.5 rounded-full bg-green-500 me-2"></div> Online
                    </div>
                <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                <button
                    type="button"
                    className="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 focus:outline-none focus:text-blue-800 disabled:opacity-50 disabled:pointer-events-none dark:text-blue-500 dark:hover:text-blue-400 dark:focus:text-blue-400"
                >
                    Deactive
                </button>
                </td>
            </tr>
        </tbody>

          </table>
        </div>
      </div>
    </div>
  </div>
</div>
    </div>
  );
};

export default User
