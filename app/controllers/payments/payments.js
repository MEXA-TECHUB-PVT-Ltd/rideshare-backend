const paypal = require("paypal-rest-sdk");
const {
  paymentCreated,
  payWithWallet,
  saveWithdrawLogs,
} = require("./utils/payments.util");
const { pool } = require("../../config/db.config");
const { saveJoinRideDetailsToDB } = require("../../utils/paymentHelper");
const API_TOKEN_REQ = "https://api.sandbox.paypal.com/v1/oauth2/token";
const axios = require("axios");
const { checkUserExists } = require("../../utils/dbValidations");
const { updateRecord, createRecord } = require("../../utils/dbHeplerFunc");

const WEB_HOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
// TODO: If ride is instant use payment api to get into the ride joiner direct else use the join ride api to first onboard on the requested ride joiner list
paypal.configure({
  mode: "live",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_ID,
});

exports.pay = async (req, res) => {
  try {
    const {
      payment_details,
      join_ride_details,
      payment_type = "paypal",
      ride_amount,
    } = req.body;

    if (payment_type === "cash") {
      const saveJoinRideDetails = await saveJoinRideDetailsToDB(
        res,
        join_ride_details,
        payment_type,
      );
      return res.json({
        status: "success",
        message: "Ride joined successfully",
        result: saveJoinRideDetails,
      });
    } else if (payment_type === "wallet") {
      const result = await payWithWallet(
        ride_amount,
        join_ride_details,
        payment_type
      );
      console.log(result);
      if (result.success) {
        return res.json({
          success: true,
          message: "Ride joined successfully",
          result: result.data,
        });
      } else {
        return res.json({
          success: false,
          message: result.message,
        });
      }
    } else if (payment_type === "paypal") {
      const {
        items = [
          {
            name: "Not Provided",
            sku: "item",
            price: "0",
            currency: "USD",
            quantity: 1,
          },
        ],
        amount = {
          currency: "USD",
          total: "0",
        },
        description = "This is the payment description.",
        redirect_urls = {
          return_url: "https://rideshare-be.mtechub.com/payment-success",
          cancel_url: "https://rideshare-be.mtechub.com/payment-cancel",
        },
      } = payment_details;

      const saveJoinRideDetails = await saveJoinRideDetailsToDB(
        res,
        join_ride_details
      );

      const rideJoinId =
        saveJoinRideDetails.data.id + "," + join_ride_details.ride_id;
      // const [jId, rId] = rideJoinId.split(",");

      console.log("rideJoinId", rideJoinId);

      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: redirect_urls,
        transactions: [
          {
            item_list: {
              items: items,
            },
            amount: amount,
            description: description,
            custom: rideJoinId,
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          // throw error;
          console.log(error);
          res.json({ error: true, message: error });
        } else {
          const approval_url = payment.links.find(
            (link) => link.rel === "approval_url"
          ).href;
          res.json({ approval_url });
        }
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment type" });
    }
  } catch (error) {
    console.error("Error processing webhook", error);
    return res.status(500).send({
      error: "Payment process failed",
      details: error,
    });
  }
};
exports.paypalWebhook = async (req, res) => {
  try {
    const { body } = req;

    let resultMessage = "Event received but not processed.";

    switch (body.event_type) {
      case "PAYMENTS.PAYMENT.CREATED":
        const rideJoinId = body.resource.transactions[0].custom;
        console.log("Payment created for RideJoinId:", rideJoinId);
        const result = await paymentCreated(body, rideJoinId);
        if (result.success) {
          console.log("Ride Joined Successfully, payment done");
          resultMessage = "Payment created and processed successfully.";
        } else {
          resultMessage = "Payment created but processing failed.";
        }
        break;
      case "PAYMENT.SALE.PENDING":
        console.log("Payment pending:", body);
        resultMessage = "Payment is pending.";
        break;
      case "PAYMENT.SALE.DENIED":
        console.log("Payment denied:", body);
        resultMessage = "Payment was denied.";
        break;
      default:
        console.log("Other event type received:", body.event_type);
        resultMessage = "Received an unhandled event type.";
    }

    return res.status(200).send({ message: resultMessage });
  } catch (error) {
    console.error("Error processing webhook", error);
    return res
      .status(500)
      .send({ error: "Webhook processing failed", details: error.toString() });
  }
};

exports.getTransactionHistory = async (req, res) => {
  const { userId } = req.params;

  try {
    // Combine queries to fetch transactions where the user is either the rider or the joiner
    const query = `
      SELECT 
        th.id, 
        th.amount, 
        th.description, 
        th.status, 
        th.withdrawal, 
        th.created_at, 
        th.updated_at,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'email', u.email
        ) AS joiner_details
      FROM transaction_history th
      LEFT JOIN users u ON th.joiner_id = u.id
      WHERE th.rider_id = $1
      ORDER BY th.created_at DESC;`;

    const result = await pool.query(query, [userId]);
    if (result.rows.length) {
      return res.json({
        success: true,
        transactions: result.rows,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No transactions found for the given user.",
      });
    }
  } catch (error) {
    console.error("Error fetching transaction history: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};


exports.getAllTransactionHistory = async (req, res) => {

  try {
    // Combine queries to fetch transactions where the user is either the rider or the joiner
    const query = `
      SELECT 
        th.*,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'email', u.email
        ) AS joiner_details
      FROM transaction_history th
      LEFT JOIN users u ON th.joiner_id = u.id
      ORDER BY th.created_at DESC;`;

    const result = await pool.query(query);
    if (result.rows.length) {
      return res.json({
        success: true,
        transactions: result.rows,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No transactions found for the given user.",
      });
    }
  } catch (error) {
    console.error("Error fetching transaction history: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};







exports.getAdminTransactionHistory = async (req, res) => {
  try {
    const query = `
      SELECT 
        *
      FROM admin_transaction_history
      ORDER BY created_at DESC;`;

    const result = await pool.query(query);
    if (result.rows.length) {
      return res.json({
        success: true,
        transactions: result.rows,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No transactions found for the given user.",
      });
    }
  } catch (error) {
    console.error("Error fetching transaction history: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// SELECT
//   th.id,
//   th.amount,
//   th.description,
//   th.created_at,
//   th.updated_at,
//   CASE
//     WHEN th.rider_id = $1 THEN 'rider'
//     ELSE 'joiner'
//   END AS role,
//   json_build_object(
//     'id', u.id,
//     'first_name', u.first_name,
//     'last_name', u.last_name,
//     'email', u.email
//   ) AS joiner_details
// FROM transaction_history th
// LEFT JOIN users u ON th.joiner_id = u.id
// WHERE th.rider_id = $1 OR th.joiner_id = $1
// ORDER BY th.created_at DESC;

exports.getUserWallet = async (req, res) => {
  const { userId } = req.params;

  try {
    // Combine queries to fetch transactions where the user is either the rider or the joiner
    const query = `
      SELECT *
      FROM wallet
      WHERE user_id = $1
      ORDER BY created_at DESC;`;

    const result = await pool.query(query, [userId]);
    if (result.rows.length) {
      return res.json({
        success: true,
        transactions: result.rows,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No transactions found for the given user.",
      });
    }
  } catch (error) {
    console.error("Error fetching transaction history: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};
exports.getAdminWallet = async (req, res) => {
  try {
    // Combine queries to fetch transactions where the user is either the rider or the joiner
    const query = `
      SELECT *
      FROM admin_wallet
      ORDER BY created_at DESC;`;

    const result = await pool.query(query);
    if (result.rows.length) {
      return res.json({
        success: true,
        transactions: result.rows[0],
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "No transactions found for the given user.",
      });
    }
  } catch (error) {
    console.error("Error fetching transaction history: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const user_name_auth =
  "AfVPDTsW8uUl6gY8WllCATHmnMtPiNiZAxi8wYYu7rjsokJ0ksPnGAF7n0cKo8OQSwGQUUu0tKPtBnCT";
const password_auth =
  "EKiEOIMhOo9wanl232p5sStCCkrBKlVFCLfQ430_d4Pe4MUQdiWwi7z4jGeWjEyCgmQ4Lo4c6-7LcCOi";

exports.withdraw = async (req, res) => {
  const { user_id, amount, email } = req.body;
  try {
    const existingWallet = await checkUserExists("wallet", "user_id", user_id);
    if (existingWallet.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found for this user." });
    }
    const parseRideAmount = parseFloat(amount);
    const parseBalance = parseFloat(existingWallet.rows[0].balance);
    if (parseRideAmount > parseBalance) {
      await saveWithdrawLogs(user_id, email, amount, {
        name: "INSUFFICIENT_FUNDS",
        message: "Insufficient funds to complete the transaction.",
      });
      return res.status(400).json({
        success: false,
        name: "INSUFFICIENT_FUNDS",
        message: "Insufficient funds to payout",
      });
    } else {
      const takePayments = parseBalance - parseRideAmount;

      const {
        data: { access_token },
      } = await axios.post(API_TOKEN_REQ, null, {
        headers: {
          Accept: "application/json",
          "Accept-Language": "en_US",
          "content-type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: user_name_auth,
          password: password_auth,
        },
        params: {
          grant_type: "client_credentials",
        },
      });

      // Create a payout
      const { data } = await axios.post(
        "https://api-m.sandbox.paypal.com/v1/payments/payouts",
        {
          sender_batch_header: {
            email_subject: "PAYOUT",
          },
          items: [
            {
              recipient_type: "EMAIL",
              amount: {
                value: amount,
                currency: "USD",
              },
              receiver: email,
              note: "Payouts",
              sender_item_id: "item_1",
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      await updateRecord("wallet", { balance: takePayments }, [], {
        column: "user_id",
        value: user_id,
      });

      await createRecord("transaction_history", {
        rider_id: user_id,
        amount: {
          total: parseRideAmount,
        },
        status: "outgoing",
        withdrawal: true,
      });
      let PaypalWithdrawObject = data;
      return res.status(200).json({
        PaypalWithdrawObject: PaypalWithdrawObject,
        message: "Transaction history created successfully",
      });
    }
  } catch (error) {
    const paypalError = error?.response?.data;
    if (paypalError) {
      await saveWithdrawLogs(user_id, email, amount, {
        name: paypalError.name,
        message: paypalError.message,
        details: paypalError.details || "No additional details available",
      });
      let clientMessage = "An error occurred during the transaction.";
      if (paypalError.name === "INSUFFICIENT_FUNDS") {
        clientMessage = "Insufficient funds to complete the transaction.";
      } else if (
        paypalError.name === "AUTHENTICATION_FAILURE" ||
        paypalError.name === "NOT_AUTHORIZED"
      ) {
        clientMessage = "Authentication failed. Please check credentials.";
      } else if (paypalError.name === "SERVICE_UNAVAILABLE") {
        clientMessage =
          "Payment service is temporarily unavailable. Please try again later.";
      }

      return res.status(500).json({ success: false, message: clientMessage });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
exports.breakPaymentThroughWallet = async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, paymentAmount, rideId, riderId } = req.body;

    await client.query("BEGIN"); // Start database transaction

    // Function to ensure wallet exists or create it with an initial balance
    async function ensureWallet(userId, initialBalance = 0) {
      const wallet = await checkUserExists("wallet", "user_id", userId);
      if (wallet.rowCount === 0) {
        await createRecord("wallet", {
          user_id: userId,
          balance: initialBalance,
        });
        return initialBalance; // Return the initial balance for a new wallet
      }
      return parseFloat(wallet.rows[0].balance); // Return the current balance if wallet exists
    }

    // Ensure both user's and rider's wallets exist or create them
    let userCurrentBalance = await ensureWallet(userId);
    let riderCurrentBalance = await ensureWallet(riderId);

    const payment = parseFloat(paymentAmount);
    const newUserBalance = userCurrentBalance - payment;
    const newRiderBalance = riderCurrentBalance + payment;

    // Update user's wallet balance
    await updateRecord("wallet", { balance: newUserBalance }, [], {
      column: "user_id",
      value: userId,
    });

    // Update rider's wallet balance
    await updateRecord("wallet", { balance: newRiderBalance }, [], {
      column: "user_id",
      value: riderId,
    });

    // Log transaction for deduction from user's account
    await createRecord(
      "transaction_history",
      {
        ride_id: rideId,
        rider_id: riderId,
        joiner_id: userId,
        amount: JSON.stringify({ total: payment, currency: "USD" }),
        description: `Deduction from user's wallet for ride payment`,
        status: "outgoing",
        withdrawal: true,
      },
      client
    );

    // Log transaction for addition to rider's account
    await createRecord("transaction_history", {
      ride_id: rideId,
      rider_id: riderId,
      joiner_id: userId,
      amount: JSON.stringify({ total: payment, currency: "USD" }),
      description: `Addition to rider's wallet for ride payment`,
      status: "incoming",
      withdrawal: false,
    });

    await client.query("COMMIT"); // Commit the transaction
    res.status(200).json({
      success: true,
      message: "Payment processed and transactions recorded successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK"); // Roll back the transaction on error
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the payment.",
      error: error.message,
    });
  } finally {
    client.release(); // Release the database client
  }
};
