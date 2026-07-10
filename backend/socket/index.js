const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Folder = require('../models/Folder');

async function userCanAccessFolder(userId, folderId) {
  if (!folderId || folderId === 'root') return true;
  const folder = await Folder.findOne({ _id: folderId, owner: userId, isDeleted: false });
  return !!folder;
}

function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User no longer exists'));
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinFolder', async (folderId) => {
      const targetRoom = `folder:${folderId || 'root'}`;
      const allowed = await userCanAccessFolder(socket.userId, folderId);
      if (!allowed) return socket.emit('errorMessage', 'Access denied to that folder');

      for (const room of socket.rooms) {
        if (room.startsWith('folder:') && room !== targetRoom) socket.leave(room);
      }
      socket.join(targetRoom);
    });

    socket.on('leaveFolder', (folderId) => {
      socket.leave(`folder:${folderId || 'root'}`);
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = initSocket;
