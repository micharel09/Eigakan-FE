import { LogOut, Menu, Search } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="max-w-6xl mx-auto flex items-center justify-between p-4 h-20">
      <div className="flex items-center gap-10 z-50">
        <Link to={"/"}>
          <img src="/public/avatar3.png" alt="logo" className="w-32 sm:w-40" />
        </Link>

        {/* desktop nav items */}
        <div className="hidden sm:flex gap-2 items-center">
          <Link to={"/"} className=" hover:underline">
            Movies
          </Link>
          <Link to={"/"} className=" hover:underline">
            TV Shows
          </Link>{" "}
          <Link to={"/"} className=" hover:underline">
            Favorite
          </Link>
          <Link to={"/"} className=" hover:underline">
            Search History
          </Link>
        </div>
      </div>

      <div className="flex gap-2 items-center z-50">
        <Link to={"/search"}>
          <Search className="size-6 cursor-pointer" />
        </Link>

        <img
          src="/avatar2.jpg"
          alt="Avatar"
          className="h-5 rounded cursor-pointer"
        />
        <LogOut className="size-6 cursor-pointer" />

        <div className="sm:hidden">
          <Menu className="size-6 cursor-pointer" onClick={toggleMobileMenu} />
        </div>
      </div>

      {/* mobile nav items */}
    </header>
  );
};

export default Navbar;
