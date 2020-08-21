const webPush = require('web-push');
const db = require('../db').pgPromise;

module.exports.subscribeBrowser = async (req, res) => {
  const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
  const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

  webPush.setVapidDetails('mailto:hello@jakepfaf.dev', publicVapidKey, privateVapidKey);

  const newSubscription = JSON.parse(req.body.subscription);
  const guestId = req.body.guestId;

  try {
    await db.task(async (t) => {
      const subscription = await t.oneOrNone(
        "SELECT * FROM subscribers WHERE owner_id = $1 AND browser -> 'keys' ->> 'auth' = $2",
        [guestId, newSubscription.keys.auth]
      );
      if (subscription) return res.status(200).send('Already subscribed to browser notifications');
      else {
        (async function () {
          const newSub = await t.one('INSERT INTO subscribers (owner_id, browser) VALUES ($1, $2) RETURNING browser', [
            guestId,
            newSubscription,
          ]);
          console.log(newSub + ' saved.');
          return res.status(200).send(newSub);
        })();
      }
    });

    // // Save subscriptions info to owner doc in DB
    // // First need to see if guest has already subscribed
    // const subscription = await db.one(
    //   "SELECT * FROM subscribers WHERE owner_id = $1 AND browser -> 'keys' ->> 'auth' = $2",
    //   [guestId, newSubscription.keys.auth]
    // );
    // if (foundSub) {
    //   return res.status(200).send('Already subscribed to browser notifications');
    // }
  } catch (err) {
    return console.log(err);
  }
  // try {
  //   const subscription = await db.one('INSERT INTO subscribers (owner_id, browser) VALUES ($1, $2) RETURNING browser', [
  //     guestId,
  //     newSubscription,
  //   ]);

  //   if (subscription) {
  //     console.log(subscription + ' saved.');
  //   }

  //   res.status(200).send(subscription);
  // } catch (err) {
  //   console.log(err);
  // }
};

module.exports.sendBrowserNotifications = async (data) => {
  const { userId, guestId, imgPath, fileCount } = data;

  try {
    const result = await db.task(async (t) => {
      const user = await db.one('SELECT first_name, guest_id FROM users WHERE user_id = $1', [userId]);
      const subscriptions = await db.any(
        'SELECT * FROM subscribers WHERE owner_id = ${guestId} AND browser IS NOT NULL',
        user
      );
      return { user, subscriptions };
    });
    if (result.subscriptions.length === 0) {
      return console.log('No browser subscriptions found.');
    }

    const payload = JSON.stringify({
      title: `${result.user.firstName} just shared ${fileCount === 1 ? 'a' : fileCount} new photo${
        fileCount > 1 ? 's' : ''
      }!`,
      body: `Click to see ${fileCount === 1 ? 'it' : 'them'}!`,
      icon: imgPath,
      guestId,
    });

    result.subscriptions.forEach((sub) => {
      const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
      const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

      webPush.setVapidDetails('mailto:notification@carousel.jakepfaf.dev', publicVapidKey, privateVapidKey);

      webPush.sendNotification(sub.browser, payload).catch(async (error) => {
        console.error(error);
        // If 410 response (subscription no longer valid), remove from DB
        if (error.statusCode == 410) {
          console.log('Removing bad sub');
          try {
            const result = await db.task(async (t) => {
              const user = await db.one('SELECT username, guestId FROM users WHERE user_id = $1', [userId]);
              const subscriptions = db.any(
                'SELECT * FROM subscribers WHERE owner_id = ${guestId} AND browser IS NOT NULL',
                user
              );
              const deletedSub = db.one(
                "DELETE FROM subscribers WHERE browser -> 'keys'->>'auth' = ${keys.auth} RETURNING *",
                sub
              );
              if (deletedSub) console.log('Removed' + deletedSub + ' from ' + user.username);
              return { user, subscriptions, deletedSub };
            });
          } catch (err) {
            console.log('Error removing bad browser subscription:', err);
          }
        }
      });
      
      return;
    });
    console.log('Browser notifications sent!');
  } catch (err) {
    return console.log(err);
  }
};
