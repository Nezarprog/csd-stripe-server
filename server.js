require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: "https://centresportifdorg.carrd.co"
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("CSD Stripe server is running");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount, email, parentName, plan } = req.body;

    const amountInCents = Math.round(Number(amount) * 100);

    if (!amountInCents || amountInCents < 100) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Inscription camp Centre Sportif Dorg",
              description: plan || "Paiement complet"
            },
            unit_amount: amountInCents
          },
          quantity: 1
        }
      ],
      metadata: {
        parentName: parentName || "",
        plan: plan || "Paiement complet",
        totalAmount: String(amount)
      },
      success_url: "https://centresportifdorg.carrd.co/?payment=success",
      cancel_url: "https://centresportifdorg.carrd.co/?payment=cancel"
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
