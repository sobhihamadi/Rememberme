import dotenv from "dotenv";
import path from "path";
import type { StringValue } from "ms";


dotenv.config({ path: path.join(__dirname, '../../.env') });

export default {
  encryption: {
    secretKey: process.env.ENCRYPTION_SECRET
  },
  NODE_ENV: process.env.NODE_ENV || 'development',
  SECRET: process.env.SECRET,
  logDir: 'logs', // Specifies the folder where log files will be saved.
   isDev: process.env.NODE_ENV==="development", // Check if the environment is development
  isProduction:process.env.NODE_ENV==="production",
  storagePath: {
    postgres: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_xaEb1hD8dLkW@ep-mute-thunder-alspdx7x-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
  auth:
{
  tokenExpiry: (process.env.TOKEN_EXPIRY || '15m') as StringValue, // Token expiry duration
  secretkey: process.env.JWT_SECRET_KEY || 'secret-111222242421',// Secret key for authentication
  tokenrefrechExpiry: (process.env.TOKEN_REFRECH_EXPIRY || '7d') as StringValue
}

};


  