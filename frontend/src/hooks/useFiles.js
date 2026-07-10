import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext.jsx';

export function useFiles(folderId) {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, joinFolder, leaveFolder } = useSocket();

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/folders', { params: { parentFolder: folderId || undefined } });
      setFolders(data.data.folders);
      setFiles(data.data.files);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (!socket) return;
    joinFolder(folderId);
    return () => leaveFolder(folderId);
  }, [socket, folderId, joinFolder, leaveFolder]);

  useEffect(() => {
    if (!socket) return;

    const onFileAdded = ({ file }) => setFiles((prev) => [...prev, file]);
    const onFileRemoved = ({ fileId }) => setFiles((prev) => prev.filter((f) => f._id !== fileId));
    const onFileRenamed = ({ file }) => setFiles((prev) => prev.map((f) => (f._id === file._id ? file : f)));
    const onFolderAdded = ({ folder }) => setFolders((prev) => [...prev, folder]);
    const onFolderRemoved = ({ folderId: id }) => setFolders((prev) => prev.filter((f) => f._id !== id));
    const onFolderRenamed = ({ folder }) => setFolders((prev) => prev.map((f) => (f._id === folder._id ? folder : f)));

    socket.on('fileAdded', onFileAdded);
    socket.on('fileRemoved', onFileRemoved);
    socket.on('fileRenamed', onFileRenamed);
    socket.on('folderAdded', onFolderAdded);
    socket.on('folderRemoved', onFolderRemoved);
    socket.on('folderRenamed', onFolderRenamed);

    return () => {
      socket.off('fileAdded', onFileAdded);
      socket.off('fileRemoved', onFileRemoved);
      socket.off('fileRenamed', onFileRenamed);
      socket.off('folderAdded', onFolderAdded);
      socket.off('folderRemoved', onFolderRemoved);
      socket.off('folderRenamed', onFolderRenamed);
    };
  }, [socket]);

  return { folders, files, loading, error, refetch: fetchChildren };
}
