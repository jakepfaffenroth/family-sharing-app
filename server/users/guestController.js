module.exports.mark = (req, res) => {
  // extracts guestId from path
  const guestId = req.path.split('/')[1];
  // Set guestId cookie on client
  res.cookie('guestId', guestId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
  res.redirect(process.env.CLIENT + '?guest=' + guestId);
};
