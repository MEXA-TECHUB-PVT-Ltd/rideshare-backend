const paypal = require("paypal-rest-sdk");
const API_TOKEN_REQ = "https://api.sandbox.paypal.com/v1/oauth2/token";

paypal.configure({
  mode: "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET_ID,
});

exports.pay = async (req, res) => {
  try {
    const {
      items = [
        {
          name: "Rimsha",
          sku: "item",
          price: "100.00",
          currency: "USD",
          quantity: 1,
        },
      ],
      amount = {
        currency: "USD",
        total: "100.00",
      },
      description = "This is the payment description.",
      redirect_urls = {
        return_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      },
    } = req.body;
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
  } catch (error) {
    console.error(error);
  }
};

exports.paypalWebhook = async (req, res) => {
  try {
    const headers = req.headers;
    const webhookEventBody = req.body;

    console.log("Received Webhook Event: ---- ----- ---- -- -- -- --- -- -", req.body);
    console.log("Received Webhook Event: HEADER:: ---- ---- ---- ---- ", req.headers);
    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("Error processing webhook", error);
    res.status(500).send("ERROR");
  }
};
