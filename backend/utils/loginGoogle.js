const { createRemoteJWKSet, jwtVerify } = require("jose");

const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

async function verifyGoogleToken(credential) {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in backend/.env");
  }

  const { payload } = await jwtVerify(credential, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  const email = String(payload.email || "").trim().toLowerCase();
  const verified =
    payload.email_verified === true ||
    payload.email_verified === "true" ||
    String(payload.email_verified || "") === "1";

  if (!email || !verified) {
    throw new Error("Email not verified by Google");
  }

  return {
    sub: String(payload.sub || ""),
    email,
    name: String(payload.name || "").trim() || email.split("@")[0],
    picture: payload.picture ? String(payload.picture).trim() : "",
  };
}

module.exports = { verifyGoogleToken };
