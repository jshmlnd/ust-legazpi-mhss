import React from 'react'
import { LogOut } from 'lucide-react';

const Navbar = () => {
  return (
    <div className="flex items-center p-2 min-h-16 w-1/2 bg-neutral backdrop-blur-lg rounded-full mt-5">
      <div className="flex-col content-center flex-1 flex-col">
        <button className="text-xl text-neutral-content font-black">UST-Legazpi</button>
        <button className="text-xl text-neutral-content">Mental Health Support</button>
      </div>
      <div className="flex gap-2 navbar-end">
        <button className='btn btn-ghost btn-xs text-xs text-neutral-content'><LogOut className='size-4' /> Logout</button>
        <div className="dropdown dropdown-end text-neutral-content">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
            </div>
          </div>
          <ul
            tabIndex="-1"
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow text-neutral-content">
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li><a>Settings</a></li>
            <li><a>Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar