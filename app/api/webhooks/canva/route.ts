import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-canva-signature");

    // In a real implementation, you would verify the signature using CANVA_WEBHOOK_SECRET
    // For now, we'll log the event and return 200
    console.log("Canva Webhook received:", body);

    // Handle different event types here
    // Example: design_published, asset_uploaded, etc.

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Canva Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
