export const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://request-stuff.vercel.app";