const webPush = require('web-push');
const db = require('../db').pgPromise;

// Marks the user as a guest
module.exports.mark = async (req, res) => {
  // extracts guestId from path
  const guestId = req.path.split('/')[1];

  const owner = await db.oneOrNone(
    'SELECT guest_id FROM owners WHERE guest_id = $1',
    [guestId]
  );
  // Set guestId cookie on client
  if (owner) {
    res.cookie('guestId', owner.guestId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
    res.redirect(process.env.CLIENT + '?guest=' + owner.guestId);
  } else {
    res
      .status(404)
      .end(
        '<div style="text-align: center;"><h1>404 - Not Found</h1> \n <h2>Invalid link</h2></div>'
      );
  }
};

// Sends guests subscription verification emails
module.exports.subscribeEmail = async (req, res) => {
  const { verifyGuestEmailSender } = require('../tasks');
  const guest = req.body;

  try {
    const owner = await db.one(
      'SELECT * FROM owners WHERE guest_id = ${guestId}',
      guest
    );
    if (owner.length === 0) {
      return console.log('Incorrect guestId in email subscription.');
    }

    // First need to see if guest has already subscribed
    const email = await db.oneOrNone(
      'SELECT * FROM subscribers WHERE guest_id = ${guestId} AND email = ${email}',
      guest
    );
    if (email) {
      res.status(200).json({ alreadySubscribed: true });
    } else {
      verifyGuestEmailSender.add({
        owner,
        guest,
      });
      res.end();
    }
  } catch (err) {
    error(err);
  }
};

module.exports.subscribeBrowser = async (req, res) => {
  const guest = req.body;
  const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
  const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

  webPush.setVapidDetails(
    'mailto:hello@jakepfaf.dev',
    publicVapidKey,
    privateVapidKey
  );

  guest.browser = JSON.parse(guest.browser);

  try {
    const subscription = await db.oneOrNone(
      "SELECT * FROM subscribers WHERE guest_id = ${guestId} AND browser -> 'keys' ->> 'auth' = ${browser.keys.auth}",
      guest
    );
    if (subscription) return res.render();
    else {
      (async function () {
        const newSub = await db.one(
          'INSERT INTO subscribers (guest_id, browser, first_name, last_name) VALUES (${guestId}, ${browser}, ${firstName}, ${lastName}) RETURNING browser',
          guest
        );
        success('New browser sub saved.');
        return res.status(200).send(newSub);
      })();
    }
  } catch (err) {
    return error(err);
  }
};

module.exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await db.any(
      'SELECT * FROM subscribers WHERE guest_id = (SELECT guest_id FROM owners WHERE owner_id = ${ownerId})',
      req.body
    );
    res.json(subscribers);
  } catch (err) {
    error(err);
  }
};
