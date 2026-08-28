import type { Handler } from "@netlify/functions";
import { createSessionCookie, passwordMatches } from "./_lib/auth";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let password = "";
  try {
    const body = JSON.parse(event.body || "{}");
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Érvénytelen kérés." }) };
  }

  if (!passwordMatches(password)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Hibás jelszó." }) };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": createSessionCookie(),
    },
    body: JSON.stringify({ ok: true }),
  };
};
