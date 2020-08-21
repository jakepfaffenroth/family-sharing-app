const User = require('./users/userModel.js');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

mongoose.connect(
  'mongodb+srv://jpfaffenroth:babylon-outlay-plasma@cluster0-2tj6b.mongodb.net/carousel?authSource=admin&replicaSet=Cluster0-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

User.find({}, (err, users) => {
  users.forEach((user) => {
    const guestId = uuidv4();
    console.log('user: ', user);
    console.log('guestId: ', guestId);
    User.findByIdAndUpdate(user._id, { guestId: guestId }, function (error, success) {
      if (error) {
        console.log('error: ', error);
      }
      if (success) {
        console.log('success');
        console.log('user: ', user);
      }
      process.exit(0);
    });
  });
});
