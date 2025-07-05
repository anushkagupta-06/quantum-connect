import Message from '../models/Message.js';

export const setupChatSocket = (io) => {
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
  
      socket.on('join', (userId) => {
        socket.join(userId);
        socket.userId = userId;
        console.log(`User ${userId} joined their room`);
      });
  
      socket.on('send-message', ({ receiverId, message }) => {
        console.log('Emitting to:', receiverId, 'Message:', message);
        io.to(receiverId).emit('receive-message', message);
      });

      socket.on("typing", ({ receiverId }) => {
        socket.to(receiverId).emit("user-typing", { from: socket.userId });
      });

      socket.on('stop-typing', ({ receiverId }) => {
        socket.to(receiverId).emit('stop-typing', { from: socket.userId });
      });

      socket.on("message-delivered", async ({ messageId, senderId }) => {
        try {
          await Message.findByIdAndUpdate(messageId, { status: 'delivered' });
          io.to(senderId).emit('message-status-updated', {
            messageId,
            status: 'delivered'
          });
        } catch (err) {
          console.error('Error updating to delivered:', err);
        }
      });
      
      socket.on("message-read", async ({ messageIds, senderId }) => {
        try {
          await Message.updateMany(
            { _id: { $in: messageIds } },
            { $set: { status: 'read' } }
          );
          io.to(senderId).emit('message-status-updated', {
            messageIds,
            status: 'read'
          });
        } catch (err) {
          console.error('Error updating to read:', err);
        }
      });
  
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  };  