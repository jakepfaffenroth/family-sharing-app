# Photo Sharing Platform

_Vue, Node.js, Express, PostgreSQL, Redis, Backblaze B2, AWS SES/SNS_

This web app provides a place for parents (or anyone) to post photos they would like to share with family and friends.
Privacy and openness are main features, with no data-mining, no ads, and no device lock-in.

Users can share unique links to their galleries with invited "guests". Guests then can simply view the galleries at the link - no signup required.
Guests may sign up to recieve email and/or browser notifications when new images are added to the gallery. 
Email notifications are rate-limited to one notification per hour

Because the primary purpose of uploading photos is sharing, not backup, images are compressed and resized on the free plan. 
Doing so makes it possible for users to store many photos for free. 
Premium paid users can store uncompressed, original quality photos and have more storage.

Low resolution, compressed thumbnail images are also generated to keep image rendering as fast as possible. 
The full size images are lazy-loaded when necessary.

Users can also download all their photos as zip files and create albums to organize them.

In the backend, the image processing pipeline uses data streams and a Redis queue system to optimize efficiency.
