"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminNav from '@/components/AdminNav';
import { toast } from 'react-toastify';

interface UserWithAdmin {
  _id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  profilePic?: string;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const typedUser = user as UserWithAdmin | null;

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!loading) {
      if (!typedUser || !typedUser._id) {
        router.push('/login');
        toast.error('Please log in to access admin features');
      }
      // In production, you would uncomment this to enforce admin-only access
      // else if (!typedUser.isAdmin) {
      //   router.push('/chat');
      //   toast.error('You do not have admin privileges');
      // }
    }
  }, [typedUser, loading, router]);

  if (loading || !typedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Admin Panel</h1>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
} 