import { hc } from "hono/client";

// Point to API Gateway for microservices architecture
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000";

export const client = hc<any>(API_GATEWAY_URL);
