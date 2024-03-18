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
    const transactionAmount = parseFloat(
      paymentDetails.resource.transactions[0].amount.total
    );
    if (isNaN(transactionAmount))
      return { success: false, message: "Invalid payment amount." };

    const adminTax = transactionAmount * adminTaxRate;
    const netAmountToRider = transactionAmount - adminTax;

    await manageWallet(rider_id, netAmountToRider);

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
      description: paymentDetails.resource.transactions[0].description,
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
    const parseBalance = parseFloat(existingWallet.rows[0].balance);
    const adminTaxRate = 0.05;
    const adminTax = parseRideAmount * adminTaxRate;

    if (parseRideAmount > parseBalance) {
      // insufficient balance to pay for a ride
      return {
        success: false,
        message: "Insufficient balance to pay for a ride",
      };
    } else {
      const takePayments = parseBalance - parseRideAmount;
      await updateRecord("wallet", { balance: takePayments }, [], {
        column: "user_id",
        value: joinerId,
      });
      await updateRecord("ride_joiners", { payment_status: true }, [], {
        column: "id",
        value: rideJoinId,
      });
      await createRecord("transaction_history", {
        ride_id: rideId,
        rider_id: existingRides.rows[0].user_id,
        joiner_id: joinerId,
        amount: {
          total: parseRideAmount,
        },
        status: "outgoing",
      });
      await createRecord("admin_transaction_history", {
        ride_id: rideId,
        amount: adminTax,
      });
      return {
        success: true,
        data: "Your transaction has been successfully processed!",
      };
    }
    // return existingWallet.rows[0];
  } catch (error) {
    throw error;
  }
};

exports.module = { saveJoinRideDetailsToDB };
