import React, { useState, useEffect } from "react";
import { notification, Switch } from "antd"; // Import Switch from antd
import UserApi from "../../../apis/User/user";
import { Pagination } from "antd";

const User = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 9,
    },
  });

  // Fetch users with pagination
  const fetchUsers = async (pagination) => {
    setLoading(true);
    try {
      const { current, pageSize } = pagination;
      const response = await UserApi.getUsers(current, pageSize);
      setUsers(response.data.users); // Update user data
      setTableParams((prevState) => ({
        ...prevState,
        pagination: {
          ...prevState.pagination,
          total: response.data.total, // Update total users count
          current,
          pageSize,
        },
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };
  

 // Handle page change
 const handlePageChange = (current, pageSize) => {
  setTableParams((prevState) => ({
    ...prevState,
    pagination: { current, pageSize },
  }));
  fetchUsers({ current, pageSize });
};


const handleStatusChange = async (id, checked) => {
  try {
    const data = {
      id,
      status: checked ? 0 : 1, 
    };

    console.log(`Sending data to API:`, data);

    // Gọi API
    const response = await UserApi.updateActive(data);  
    if (response && response.status === 200) {
      // Nếu API thành công, cập nhật trạng thái trong danh sách người dùng
      const updatedUsers = users.map((user) =>
        user.id === id
          ? { ...user, status: data.status === 0 ? "NORMAL" : "INACTIVE" }
          : user
      );
      setUsers(updatedUsers);
      notification.success({ message: 'Updated user status successfully.' });
    } else {
      console.error(`Failed to update status for user ID ${id}`);
      notification.error({ message: 'Updated user status successfully.' });
    }
  } catch (error) {
    console.error(`Error updating status for user ID ${id}:`, error.message);
  }
};



useEffect(() => {
  fetchUsers(tableParams.pagination); // Fetch users when component mounts
}, []);

  return (
    <div>
      <div className="flex flex-col">
        <div className="-m-1.5 overflow-x-auto">
          <div className="p-1.5 min-w-full inline-block align-middle">
            <div className="border rounded-lg divide-y divide-gray-200 dark:border-neutral-700 bg-white">
              {/* Table Header */}
              <div className="py-3 px-4 flex justify-between">
                <div className="relative max-w-xs">
                  {/* Search */}
                  <label htmlFor="hs-table-search" className="sr-only">
                    Search
                  </label>
                  <input
                    type="text"
                    name="hs-table-search"
                    id="hs-table-search"
                    className="py-2 px-3 ps-9 block w-full border rounded-lg text-sm focus:z-10 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 bg-white"
                    placeholder="Search for user"
                  />
                  <div className="absolute inset-y-0 start-0 flex items-center pointer-events-none ps-3">
                    <svg
                      className="size-4 text-gray-400 dark:text-neutral-500"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.3-4.3"></path>
                    </svg>
                  </div>
                </div>

                {/* Create Button */}
                <button
                  type="button"
                  className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-red-600 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700"
                >
                  Create
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                    />
                  </svg>
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                  <thead className="bg-slate-100">
                    <tr>
                      <th scope="col" className="py-3 px-4 pe-0">
                        <div className="flex items-center h-5">
                          <input
                            id="hs-table-search-checkbox-all"
                            type="checkbox"
                            className="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-neutral-700 dark:border-neutral-500"
                          />
                          <label
                            htmlFor="hs-table-search-checkbox-all"
                            className="sr-only"
                          >
                            Checkbox
                          </label>
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-start text-xs font-medium text-black uppercase"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-start text-xs font-medium text-black uppercase"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-start text-xs font-medium text-black uppercase"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-start text-xs font-medium text-black uppercase"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-end text-xs font-medium text-black uppercase"
                      >
                        Join Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {users.map((user) => (
                      <tr key={user.id}> 
                        <td className="py-3 ps-4">
                          <div className="flex items-center">
                            <img
                              src={user.picture}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          <a href="">{user.fullName}</a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {user.email} 
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            user.roleName === "ADMIN"
                              ? "text-red-600"
                              : user.roleName === "USER"
                              ? "text-green-500"
                              : "text-black"
                          }`}
                        >
                          {user.roleName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <Switch
                            checkedChildren="NORMAL"
                            unCheckedChildren="INACTIVE"
                            defaultChecked={user.status}
                            checked={user.status === "NORMAL"}
                            onChange={(checked) => handleStatusChange(user.id , checked)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                          {new Date(user.createDate).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="py-3 px-4 flex justify-end">
              <Pagination
                current={tableParams.pagination.current}
                pageSize={tableParams.pagination.pageSize}
                total={tableParams.pagination.total} // Total user count
                onChange={handlePageChange} // Handle page change
                showSizeChanger
                pageSizeOptions={[10, 20, 30, 40]}
              />

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default User;
