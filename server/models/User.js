import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: {
    type: String,
    default: "", 
  },
  bio: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model('User', userSchema);