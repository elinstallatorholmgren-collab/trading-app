import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

});

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    console.log("CHECKOUT USER:", userId, email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      customer_email: email,

      line_items: [
        {
          price: "price_1TLQ4hQhOE1WJo4XtSnUn2ef", // 🔥 byt till din riktiga
          quantity: 1,
        },
      ],

      success_url: "http://localhost:3000/app?success=true",
      cancel_url: "http://localhost:3000/app",

      // 🔥 DETTA VAR DIN BUG
      metadata: {
        userId: userId,
      },
    });

    console.log("SESSION CREATED:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}