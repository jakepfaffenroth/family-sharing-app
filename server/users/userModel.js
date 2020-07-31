const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  images: { type: Array, required: true },
  guestId: { type: String, required: true },
  lastNotification: { type: Date, required: true },
  subscribers: { email: { type: Array, required: true }, browser: { type: Array, required: true } },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
