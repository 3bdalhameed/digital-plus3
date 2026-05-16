import { NextResponse } from "next/server";

export const revalidate = 86400; // cache 24 hours on the server

export async function GET() {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("upstream error");
    const data = await res.json();
    return NextResponse.json({
      rates: {
        USD: 1,
        SAR: data.rates.SAR,
        JOD: data.rates.JOD,
        AED: data.rates.AED,
      },
      date: data.date,
    });
  } catch {
    // fall back to fixed rates so the store always gets a valid response
    return NextResponse.json({
      rates: { USD: 1, SAR: 3.75, JOD: 0.71, AED: 3.67 },
      date: new Date().toISOString().slice(0, 10),
    });
  }
}
