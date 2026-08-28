import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authenticated: isAuthenticated(event.headers.cookie) }),
  };
};
