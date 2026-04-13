import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  console.log("CHECKOUT HIT"); // debug

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Trading Discipline Pro",
          },
          unit_amount: 800,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    success_url: "http://localhost:3000/app",
    cancel_url: "http://localhost:3000/app",
  });

  return NextResponse.json({ url: session.url });
}