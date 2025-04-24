"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaUsers, FaPaperPlane, FaChartBar } from 'react-icons/fa';

const AdminNav = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold">LetterChat Admin</h1>
        <p className="text-xs text-gray-400 mt-1">Manage your messaging platform</p>
      </div>
      
      <nav>
        <ul className="space-y-2">
          <li>
            <Link
              href="/admin"
              className={`flex items-center p-2 rounded-md ${
                isActive('/admin') && !isActive('/admin/campaigns') && !isActive('/admin/users')
                  ? 'bg-blue-600'
                  : 'hover:bg-gray-700'
              }`}
            >
              <FaHome className="mr-3" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/admin/users"
              className={`flex items-center p-2 rounded-md ${
                isActive('/admin/users') ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <FaUsers className="mr-3" />
              Users
            </Link>
          </li>
          <li>
            <Link
              href="/admin/campaigns"
              className={`flex items-center p-2 rounded-md ${
                isActive('/admin/campaigns') ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <FaPaperPlane className="mr-3" />
              SMS Campaigns
            </Link>
          </li>
          <li>
            <Link
              href="/admin/analytics"
              className={`flex items-center p-2 rounded-md ${
                isActive('/admin/analytics') ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <FaChartBar className="mr-3" />
              Analytics
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="mt-8 pt-4 border-t border-gray-700">
        <Link
          href="/chat"
          className="flex items-center p-2 rounded-md hover:bg-gray-700"
        >
          <span>← Back to Chat</span>
        </Link>
      </div>
    </div>
  );
};

export default AdminNav; 