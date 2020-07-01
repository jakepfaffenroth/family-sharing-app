module.exports.mark = (req, res) => {
  // extracts userId from path
  const userId = req.path.split('/')[1];
  // Set guestId cookie on client
  res.cookie('guestId', userId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
  res.redirect(process.env.CLIENT);
};
