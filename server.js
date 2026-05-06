require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: "https://centresportifdorg.com"
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("CSD Stripe server is running");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, email, parentName, plan } = req.body;

    let originalAmount = Number(amount);
    let amountToCharge = originalAmount;
    let paymentDescription = "Paiement complet";

    if (!originalAmount || originalAmount < 1) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    if (plan && plan.includes("4")) {
      amountToCharge = originalAmount * 0.25;
      paymentDescription = "Premier versement sur 4";
    } else if (plan && plan.includes("2")) {
      amountToCharge = originalAmount * 0.5;
      paymentDescription = "Premier versement sur 2";
    }

    const amountInCents = Math.round(amountToCharge * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Inscription camp Centre Sportif Dorg",
              description: paymentDescription
            },
            unit_amount: amountInCents
          },
          quantity: 1
        }
      ],
      metadata: {
        parentName: parentName || "",
        plan: plan || "Paiement complet",
        totalOriginal: String(originalAmount),
        amountChargedNow: String(amountToCharge),
        paymentDescription
      },
      success_url: "https://centresportifdorg.com/?payment=success",
      cancel_url: "https://centresportifdorg.com.co/?payment=cancel"
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

const PORT = process.env.PORT || 4242;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
