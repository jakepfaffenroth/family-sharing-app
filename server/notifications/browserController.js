const webPush = require('web-push');
const db = require('../db').pgPromise;

module.exports.sendBrowserNotifications = async (data) => {
  const { userId, guestId, thumbPath, fileCount } = data;

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
      return info('No browser subscriptions found.');
    }

    const payload = JSON.stringify({
      title: `${result.user.firstName} just shared ${fileCount === 1 ? 'a' : fileCount} new photo${
        fileCount > 1 ? 's' : ''
      }!`,
      body: `Click to see ${fileCount === 1 ? 'it' : 'them'}!`,
      icon: thumbPath,
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
              if (deletedSub) info('Removed' + deletedSub + ' from ' + user.username);
              return { user, subscriptions, deletedSub };
            });
          } catch (err) {
            error('Error removing bad browser subscription:', err);
          }
        }
      });

      return;
    });
    success('Browser notifications sent!');
  } catch (err) {
    return error(err);
  }
};
