import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Trading Discipline Pro",
          },
          unit_amount: 800, // $8
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url:
      "https://trading-app-three-gamma.vercel.app/app?success=true",
    cancel_url:
      "https://trading-app-three-gamma.vercel.app/app",
  });

  return NextResponse.json({ url: session.url });
}