"use client";

import { FaUsers, FaComment, FaPaperPlane, FaBell } from "react-icons/fa";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FaUsers size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">2,457</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FaComment size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Messages</p>
              <p className="text-2xl font-bold">48,294</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FaPaperPlane size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">SMS Campaigns</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FaBell size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold">1,293</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/admin/campaigns"
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg flex items-center"
          >
            <FaPaperPlane className="mr-3" />
            Create New Campaign
          </Link>
          <Link 
            href="/admin/users"
            className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg flex items-center"
          >
            <FaUsers className="mr-3" />
            Manage Users
          </Link>
          <Link 
            href="/admin/analytics"
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg flex items-center"
          >
            <FaBell className="mr-3" />
            View Analytics
          </Link>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="border-b pb-3">
            <p className="text-gray-600">Campaign &quot;Summer Promotion&quot; was sent to 1,245 users</p>
            <p className="text-xs text-gray-400">Today at 3:45 PM</p>
          </div>
          <div className="border-b pb-3">
            <p className="text-gray-600">New user John Doe registered</p>
            <p className="text-xs text-gray-400">Today at 1:23 PM</p>
          </div>
          <div className="border-b pb-3">
            <p className="text-gray-600">Campaign &quot;Weekly Newsletter&quot; was sent to 2,341 users</p>
            <p className="text-xs text-gray-400">Yesterday at 9:00 AM</p>
          </div>
          <div>
            <p className="text-gray-600">User Maria Garcia updated their profile</p>
            <p className="text-xs text-gray-400">2 days ago</p>
          </div>
        </div>
      </div>
    </div>
  );
} 