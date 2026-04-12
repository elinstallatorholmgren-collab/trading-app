import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: "price_1TLQ4hQhOE1WJo4XtSnUn2ef",
        quantity: 1,
      },
    ],
    success_url: "http://localhost:3000/app",
    cancel_url: "http://localhost:3000/app",
  });

  return NextResponse.json({ url: session.url });
}