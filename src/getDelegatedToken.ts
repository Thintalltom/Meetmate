import { PublicClientApplication } from "@azure/msal-node";
import * as dotenv from 'dotenv';
dotenv.config();
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID!,
    authority: "https://login.microsoftonline.com/consumers", // or "common"
  },
};

const pca = new PublicClientApplication(msalConfig);

export async function getDelegatedToken() {
  const password = process.env.Password;
  if (!password) {
    throw new Error("Password environment variable is not set.");
  }
  const tokenRequest = {
    scopes: ["User.Read", "Calendars.ReadWrite"],
    username: "adeyanjutomide@gmail.com",
    password: password,
  };

  try {
    const response = await pca.acquireTokenByUsernamePassword(tokenRequest);
    return response?.accessToken;
  } catch (err) {
    console.error("Failed to get token:", err);
    return null;
  }
}
