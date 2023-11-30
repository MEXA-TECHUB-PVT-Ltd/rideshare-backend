const sendEmail = require("../lib/sendEmail");

async function notifyUsersForNewRide(rideData) {
  try {
    // Extract coordinates from ride data
    const { pickup_location, drop_off_location } = rideData;

    // Convert string coordinates to float
    const [pickupLat, pickupLong] = pickup_location
      .replace(/[()]/g, "")
      .split(",")
      .map(Number);
    const [dropOffLat, dropOffLong] = drop_off_location
      .replace(/[()]/g, "")
      .split(",")
      .map(Number);

    // Define a radius within which to search for notifications
    const searchRadius = 50; // in miles or kilometers based on your calculateDistance function

    // Query to find matching notifications
    const notifications = await findMatchingNotifications(
      pickupLat,
      pickupLong,
      dropOffLat,
      dropOffLong,
      searchRadius
    );

    // Send emails to users with matching notifications
    notifications.forEach((notification) => {
      const emailContent = createEmailContent(rideData, notification);
      sendEmail(notification.user_email, "New Ride Available!", emailContent);
    });

    console.log(`Notified ${notifications.length} users about the new ride.`);
  } catch (error) {
    console.error("Error notifying users:", error);
  }
}

async function findMatchingNotifications(
  pickupLat,
  pickupLong,
  dropOffLat,
  dropOffLong,
  searchRadius
) {
  // Implement the logic to query your database and find notifications
  // that fall within the searchRadius of the given pickup and drop-off coordinates.
  // This will likely involve a spatial query if your database supports it.
  // Return an array of notifications (including user email).
}

function createEmailContent(rideData, notification) {
  // Create and return the HTML content for the email based on rideData and notification details.
  // This could include details like pickup and drop-off locations, time, price, etc.
}

module.exports = notifyUsersForNewRide;
