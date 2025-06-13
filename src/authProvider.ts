import { ConfidentialClientApplication } from '@azure/msal-node';
import * as dotenv from 'dotenv';
dotenv.config();

export const msalInstance = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET!,
  }
});