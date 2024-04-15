const { pool } = require("../../../config/db.config");
const { createRecord, updateRecord } = require("../../../utils/dbHeplerFunc");
const { checkUserExists } = require("../../../utils/dbValidations");
const { saveJoinRideDetailsToDB } = require("../../../utils/paymentHelper");

/**
 * update the join ride details for payment status true
 * update the rider wallet
 * keep track of transaction history
 */

exports.paymentCreated = async (paymentDetails, ids) => {
  if (!paymentDetails || !ids) {
    return { success: false, message: "Invalid payment details or IDs." };
  }

  const adminTaxRate = 0.05;

  const [rjId, rId] = ids.split(",").map((id) => parseInt(id, 10));
  if (isNaN(rjId) || isNaN(rId)) {
    return { success: false, message: "Invalid ride join or ride IDs." };
  }

  console.log({ code: "IDs", rjId, rId });

  let rideJoinerUserId;

  try {
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
    const ride_id = ride.rows[0].id;
    console.log("rideJoinerUserId", rideJoinerUserId, rider_id);
    const transactionAmount = parseFloat(
      paymentDetails.resource.transactions[0].amount.total
    );
    if (isNaN(transactionAmount))
      return { success: false, message: "Invalid payment amount." };

    const adminTax = transactionAmount * adminTaxRate;
    const netAmountToRider = transactionAmount - adminTax;

    await manageWallet(rider_id, netAmountToRider);

    console.log("rider_id", rider_id);

    const admin = await checkUserExists("users", "role", "admin");
    if (ride.rowCount === 0)
      return { success: false, message: "Ride not found." };
    const adminId = admin.rows[0].id;
    await manageWallet(adminId, adminTax, true);

    await createRecord("transaction_history", {
      ride_id,
      rider_id,
      joiner_id: rideJoinerUserId,
      amount: {
        total: transactionAmount,
        currency: "USD",
        admin_tax: adminTax,
      },
      description: "Payment with paypal",
      adminTax: adminTax,
    });
    await createRecord("admin_transaction_history", {
      ride_id,
      amount: adminTax,
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
  const walletTable = isAdmin ? "admin_wallet" : "wallet";
  const existingWallet = await checkUserExists(walletTable, "user_id", userId);

  if (existingWallet.rowCount > 0) {
    const currentBalance = parseFloat(existingWallet.rows[0].balance);
    await updateRecord(walletTable, { balance: currentBalance + amount }, [], {
      column: "user_id",
      value: userId,
    });
  } else {
    await createRecord(walletTable, { user_id: userId, balance: amount }, []);
  }
}

/**
 * pay with wallet
 */

exports.payWithWallet = async (rideAmount, joinRideDetails, paymentType) => {
  try {
    const saveJoinRideDetails = await saveJoinRideDetailsToDB(joinRideDetails);
    const rideJoinId = saveJoinRideDetails.data.id;
    const joinerId = saveJoinRideDetails.data.user_id;
    const rideId = saveJoinRideDetails.data.ride_id;
    const existingWallet = await checkUserExists("wallet", "user_id", joinerId);
    const existingRides = await checkUserExists("rides", "id", rideId);
    const parseRideAmount = parseFloat(rideAmount);
    const adminTaxRate = 0.05;
    const adminTax = parseRideAmount * adminTaxRate;

    let walletBalance;

    // Check if the wallet exists and assign current balance or set it to zero if no wallet exists
    if (existingWallet.rowCount > 0) {
      walletBalance = parseFloat(existingWallet.rows[0].balance);
    } else {
      walletBalance = 0; // Initialize wallet balance as 0 if wallet doesn't exist
    }

    // Calculate new balance regardless of current balance
    const newBalance = walletBalance - parseRideAmount;

    // Update or create wallet with new balance
    if (existingWallet.rowCount > 0) {
      await updateRecord("wallet", { balance: newBalance }, [], {
        column: "user_id",
        value: joinerId,
      });
    } else {
      await createRecord("wallet", {
        user_id: joinerId,
        balance: newBalance,
      });
    }

    // Update ride joiner's payment status
    await updateRecord("ride_joiners", { payment_status: true }, [], {
      column: "id",
      value: rideJoinId,
    });

    // Log transaction history for rider
    await createRecord("transaction_history", {
      ride_id: rideId,
      rider_id: existingRides.rows[0].user_id,
      joiner_id: joinerId,
      amount: { total: parseRideAmount },
      status: "incoming",
      description: "Payment through wallet!",
      adminTax: adminTax
    });

    // Log admin transaction for the tax
    await createRecord("admin_transaction_history", {
      ride_id: rideId,
      amount: adminTax,
    });

    return {
      success: true,
      data: "Your transaction has been successfully processed!",
    };
  } catch (error) {
    throw error;
  }
};


exports.saveWithdrawLogs = async (userId, email, amount,  errors) => {
  try {
    await pool.query(
      `INSERT INTO error_logs (user_id, email, amount, errors, type) VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, amount, errors, "WITHDRAW_ERROR_LOGS"]
    );
  } catch (error) {
    throw error;
  }
};

exports.module = { saveJoinRideDetailsToDB };
