import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { anonymousId, displayName, company } = await request.json();

    if (!anonymousId) {
      return NextResponse.json(
        { message: "Anonymous ID is required" },
        { status: 400 }
      );
    }

    // Use service role client for inserting users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create anonymous user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        username: `anon_${anonymousId}`,
        anonymous_id: anonymousId,
        display_name: displayName || null,
        company: company || null,
        is_anonymous: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating anonymous user:", error);
      return NextResponse.json(
        { message: "Failed to create user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      anonymousId,
      profileUrl: `/u/${anonymousId}`,
    });
  } catch (error) {
    console.error("Error in anonymous auth:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
