import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Signature fail:", err.message);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  // 🔥 ONLY THIS MATTERS
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;

    console.log("USER FROM STRIPE:", userId);

    if (!userId) {
      console.error("❌ userId missing");
      return NextResponse.json({ ok: false });
    }

    await supabase
      .from("profiles")
      .update({ is_pro: true })
      .eq("id", userId);

    console.log("✅ PRO ACTIVATED");
  }

  return NextResponse.json({ received: true });
}