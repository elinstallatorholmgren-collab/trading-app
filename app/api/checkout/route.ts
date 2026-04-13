import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST() {
  try {
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
            unit_amount: 800, // $8
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],

      success_url: "https://trading-app-three-gamma.vercel.app/app",
      cancel_url: "https://trading-app-three-gamma.vercel.app/app",
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Stripe error" }, { status: 500 });
  }
}