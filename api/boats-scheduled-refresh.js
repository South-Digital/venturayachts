import { getCachedBaseDataset } from "./_boats/shared.js";

const handler = async () => {
  await getCachedBaseDataset({ forceRefresh: true });
};

// The schedule lives in vercel.json ("crons"), not here — Vercel invokes this
// path by HTTP rather than reading a config export. Kept at */30 UTC, as before.

// Vercel's Node runtime treats a bare default-exported function as the legacy
// (req, res) Node handler: it would be invoked with IncomingMessage/ServerResponse,
// the returned Response would be discarded and the request would hang until it
// failed with FUNCTION_INVOCATION_FAILED. Exporting an object with a `fetch`
// method is the documented Web-standard shape, and it keeps the handler above
// byte-for-byte identical to the Netlify original.
export default { fetch: handler };
