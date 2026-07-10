import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiHardDrive, FiLock, FiFile } from 'react-icons/fi';
import api from '../api/axios';

export default function SharedResource() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/share/${token}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'This link is invalid'));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3 px-4">
        <FiLock className="text-red-400" size={28} />
        <p className="text-gray-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 bg-gray-50">
      <div className="flex items-center gap-2 text-gray-400">
        <FiHardDrive size={16} /> <span className="text-xs">Shnoor Cloud - Drive</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 flex flex-col items-center gap-3 max-w-sm w-full">
        <FiFile className="text-blue-500" size={32} />
        <h1 className="text-lg font-semibold text-gray-900 text-center">{data.resource.name}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${data.permission === 'edit' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
          {data.permission === 'edit' ? 'Can edit' : 'View only'}
        </span>

        {data.resourceType === 'file' && (
          <a
            href={data.resource.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded text-sm font-medium"
          >
            Open file
          </a>
        )}
      </div>
    </div>
  );
}
