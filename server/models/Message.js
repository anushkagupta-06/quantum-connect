import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    }
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;