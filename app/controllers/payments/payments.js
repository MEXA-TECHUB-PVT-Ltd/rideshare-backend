const paypal = require("paypal-rest-sdk");
const {
  saveJoinRideDetailsToDB,
  paymentCreated,
} = require("./utils/payments.util");
const { pool } = require("../../config/db.config");
const API_TOKEN_REQ = "https://api.sandbox.paypal.com/v1/oauth2/token";

const WEB_HOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
// TODO: If ride is instant use payment api to get into the ride joiner direct else use the join ride api to first onboard on the requested ride joiner list
paypal.configure({
  mode: "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_ID,
});

exports.pay = async (req, res) => {
  try {
    const { payment_details, join_ride_details, payment_type = "paypal" } = req.body;

    if (payment_type === "cash") {
      const saveJoinRideDetails = await saveJoinRideDetailsToDB(join_ride_details, payment_type);
      return res.json({
        status: "success",
        message: "Ride joined successfully",
        result: saveJoinRideDetails,
      }); 
    } else {
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
          return_url: "http://localhost:3025/payment-success",
          cancel_url: "http://localhost:3000/cancel",
        },
      } = payment_details;

      const saveJoinRideDetails = await saveJoinRideDetailsToDB(
        join_ride_details
      );

      const rideJoinId =
        saveJoinRideDetails.data.id + "," + join_ride_details.ride_id;
      // const [jId, rId] = rideJoinId.split(",");

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
          res.json({ error: true, message: error });
        } else {
          const approval_url = payment.links.find(
            (link) => link.rel === "approval_url"
          ).href;
          res.json({ approval_url });
        }
      });
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

    let resultMessage = "Event received but not processed."; // Default message

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
        th.created_at, 
        th.updated_at,
        CASE 
          WHEN th.rider_id = $1 THEN 'rider' 
          ELSE 'joiner' 
        END AS role,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'email', u.email
        ) AS joiner_details
      FROM transaction_history th
      LEFT JOIN users u ON th.joiner_id = u.id
      WHERE th.rider_id = $1 OR th.joiner_id = $1
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
