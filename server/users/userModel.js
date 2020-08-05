const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  _id: { type: String },
  fileId: { type: String },
  smallFileId: { type: String },
  fileName: { type: String },
  src: { type: String },
  thumbnail: { type: String },
  w: { type: Number },
  h: { type: Number },
  exif: { type: Object },
  uploadTime: { type: Number },
});

const userSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  images: [imageSchema],
  guestId: { type: String, required: true },
  lastNotification: { type: Date, required: true },
  subscribers: { email: { type: Array, required: true }, browser: { type: Array, required: true } },
});

const User = mongoose.model('User', userSchema);
const Image = mongoose.model('Image', imageSchema);

module.exports = { User, Image };
