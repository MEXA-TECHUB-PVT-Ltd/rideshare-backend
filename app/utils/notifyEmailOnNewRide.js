const { pool } = require("../config/db.config");
const sendEmail = require("../lib/sendEmail");
const { responseHandler } = require("./commonResponse");
const { checkUserExists } = require("./dbValidations");

exports.notifyUsersForNewRide = async (rideData) => {
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

    const searchRadius = 50;

    const notifications = await findMatchingNotifications(
      pickupLat,
      pickupLong,
      dropOffLat,
      dropOffLong,
      searchRadius
    );

    // Send emails to users with matching notifications
    notifications.forEach(async (notification) => {
      const response = await notification;
      const { user_email: email, drop_off_address, pickup_address } = response;
      // const emailContent = createEmailContent(rideData, notification);
      await sendEmail(
        email,
        "New Ride Available!",
        `Ride is now available for ${pickup_address} and ${drop_off_address}`
      );
    });

    console.log(`Notified ${notifications.length} users about the new ride.`);
  } catch (error) {
    console.error("Error notifying users:", error);
  }
};

async function findMatchingNotifications(
  pickupLat,
  pickupLong,
  dropOffLat,
  dropOffLong,
  searchRadius
) {
  try {
    const allNotificationsQuery = `SELECT * FROM search_ride_notifications;`;
    const allNotificationsResult = await pool.query(allNotificationsQuery);
    const allNotifications = allNotificationsResult.rows;

    return allNotifications
      .filter((notification) => {
        const notificationPickupLat = parseFloat(
          notification.pickup_location.x
        );
        const notificationPickupLong = parseFloat(
          notification.pickup_location.y
        );
        const notificationDropOffLat = parseFloat(
          notification.drop_off_location.x
        );
        const notificationDropOffLong = parseFloat(
          notification.drop_off_location.y
        );

        const pickupDistance = calculateDistance(
          pickupLat,
          pickupLong,
          notificationPickupLat,
          notificationPickupLong
        );
        const dropOffDistance = calculateDistance(
          dropOffLat,
          dropOffLong,
          notificationDropOffLat,
          notificationDropOffLong
        );

        return (
          pickupDistance <= searchRadius && dropOffDistance <= searchRadius
        );
      })
      .map(async (notification) => {
        const user = await checkUserExists("users", "id", notification.user_id);
        console.log(user.rows[0])
        if (user.rowCount === 0) {
          console.error("user not found");
        }
        
        return {
          user_email: user.rows[0].email,
          ...notification,
        };
      });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 0.621371;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
