"use client";

import { useState, useEffect } from 'react';
import { getCampaigns } from '@/services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEye, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import Link from 'next/link';

interface Campaign {
  _id: string;
  title: string;
  content: string;
  status: string;
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  createdAt: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const data = await getCampaigns();
        setCampaigns(data);
      } catch (error) {
        console.error('Error loading campaigns:', error);
        toast.error('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Campaigns</h1>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SMS Campaigns</h1>
          <Link
            href="/admin/campaigns"
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-600"
          >
            <FaPlus className="mr-2" />
            New Campaign
          </Link>
        </div>

        {campaigns.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metrics
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{campaign.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        campaign.status === 'sent' ? 'bg-green-100 text-green-800' : 
                        campaign.status === 'failed' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaUsers className="mr-2 text-blue-500" />
                        {campaign.recipientCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        {formatDate(campaign.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Delivered: {campaign.deliveredCount}/{campaign.recipientCount}</div>
                      <div>Read: {campaign.readCount}/{campaign.recipientCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/admin/campaigns/${campaign._id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <FaEye className="inline mr-1" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="text-gray-500 mb-4">
              <p className="text-lg">No campaigns found</p>
              <p className="text-sm mt-2">Create your first SMS campaign to get started</p>
            </div>
            <Link
              href="/admin/campaigns"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-blue-600"
            >
              <FaPlus className="inline mr-2" />
              Create Campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 