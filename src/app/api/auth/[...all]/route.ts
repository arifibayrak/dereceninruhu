import { getAuth } from "@/lib/auth";

// Better Auth handles all /api/auth/* routes (sign-in, sign-out, session, ...).
export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  return getAuth().handler(request);
}
