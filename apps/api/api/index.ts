import { createApp } from '../src/main';

// Vercel serverless entry: hand the request to Nest's underlying Express app.
export default async function handler(req: any, res: any) {
  const app = await createApp();
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}
