// src/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Create the MSW server and use the defined request handlers
export const server = setupServer(...handlers);
