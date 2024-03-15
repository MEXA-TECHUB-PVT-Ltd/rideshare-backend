const { createRecord, updateRecord } = require("../../../utils/dbHeplerFunc");
const { checkUserExists } = require("../../../utils/dbValidations");

exports.saveJoinRideDetailsToDB = async (join_ride_details, type) => {
  const data = {
    user_id: join_ride_details.joiner_id,
    ride_id: join_ride_details.ride_id,
    price_offer: join_ride_details.price_offer,
    price_per_seat: join_ride_details.price_per_seat,
    pickup_location: join_ride_details.pickup_location,
    drop_off_location: join_ride_details.drop_off_location,
    total_distance: join_ride_details.total_distance,
    pickup_time: join_ride_details.pickup_time,
    no_seats: join_ride_details.no_seats,
    status: "accepted",
    payment_type: type
  };
  if (type === "cash") {
    data["payment_status"] = true;
  }
  try {
    return await createRecord("ride_joiners", data, []);
  } catch (error) {
    throw error;
  }
};

/**
 * update the join ride details for payment status true
 * update the rider wallet
 * keep track of transaction history
 */

exports.paymentCreated = async (paymentDetails, ids) => {
  if (!paymentDetails || !ids) {
    return { success: false, message: "Invalid payment details or IDs." };
  }

  const adminTaxRate = 0.05; // 5% tax rate

  // Parsing IDs and checking for validity
  const [rjId, rId] = ids.split(",").map((id) => parseInt(id, 10));
  if (isNaN(rjId) || isNaN(rId)) {
    return { success: false, message: "Invalid ride join or ride IDs." };
  }

  let rideJoinerUserId;

  try {
    // Assuming the function updateRecord updates a record, and createRecord creates a new record in the database
    const updateRideJoiner = await updateRecord(
      "ride_joiners",
      { payment_status: true },
      [],
      {
        column: "id",
        value: rjId,
      }
    );

    rideJoinerUserId = updateRideJoiner.user_id;

    const ride = await checkUserExists("rides", "id", rId);
    if (ride.rowCount === 0)
      return { success: false, message: "Ride not found." };

    const rider_id = ride.rows[0].user_id;
    const transactionAmount = parseFloat(
      paymentDetails.resource.transactions[0].amount.total
    );
    if (isNaN(transactionAmount))
      return { success: false, message: "Invalid payment amount." };

    const adminTax = transactionAmount * adminTaxRate;
    const netAmountToRider = transactionAmount - adminTax;

    // Update the rider's wallet
    await manageWallet(rider_id, netAmountToRider);

    // Update the admin's wallet
    const admin = await checkUserExists("users", "role", "admin");
    if (ride.rowCount === 0)
      return { success: false, message: "Ride not found." };
    const adminId = admin.rows[0].id; // Assuming you have a way to identify the admin's user_id or wallet_id
    await manageWallet(adminId, adminTax, true); // The 'true' flag indicates this is for the admin

    // Record the transaction in the transaction history
    await createRecord("transaction_history", {
      rider_id,
      joiner_id: rideJoinerUserId,
      amount: {
        total: transactionAmount,
        currency: "USD",
        admin_tax: adminTax,
      },
      description: paymentDetails.resource.transactions[0].description,
    });

    return {
      success: true,
      message: "Payment processed and records updated successfully.",
    };
  } catch (error) {
    console.error("Error processing payment:", error);
    return {
      success: false,
      message: `Error processing payment: ${error.message}`,
    };
  }
};

async function manageWallet(userId, amount, isAdmin = false) {
  const walletTable = isAdmin ? "admin_wallet" : "wallet"; // Choose the correct table
  // Attempt to find the existing wallet by user_id for both admin and users
  const existingWallet = await checkUserExists(walletTable, "user_id", userId);

  if (existingWallet.rowCount > 0) {
    // Wallet exists, so update the balance
    const currentBalance = parseFloat(existingWallet.rows[0].balance);
    await updateRecord(walletTable, { balance: currentBalance + amount }, [], {
      column: "user_id",
      value: userId,
    });
  } else {
    // No wallet exists, so create a new one
    // This branch now handles both admin and user wallets, given both have the same structure
    await createRecord(walletTable, { user_id: userId, balance: amount }, []);
  }
}
