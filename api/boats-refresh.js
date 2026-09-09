import {
  getCachedBaseDataset,
  jsonResponse,
  corsPreflightResponse,
  corsGuardResponse,
} from "./_boats/shared.js";

const handler = async (req) => {
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  const corsGuard = corsGuardResponse(req);
  if (corsGuard) {
    return corsGuard;
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed. Use POST." }, 405, {
      allow: "POST",
    }, req);
  }

  try {
    const base = await getCachedBaseDataset({ forceRefresh: true });
    return jsonResponse({
      ok: true,
      last_updated: base.last_updated,
      stale: base.stale,
      source_status: base.source_status,
      total: base.data?.length ?? 0,
    }, 200, {}, req);
  } catch (e) {
    return jsonResponse({ ok: false, error: e?.message || "Refresh failed" }, 500, {}, req);
  }
};

// Vercel's Node runtime treats a bare default-exported function as the legacy
// (req, res) Node handler: it would be invoked with IncomingMessage/ServerResponse,
// the returned Response would be discarded and the request would hang until it
// failed with FUNCTION_INVOCATION_FAILED. Exporting an object with a `fetch`
// method is the documented Web-standard shape, and it keeps the handler above
// byte-for-byte identical to the Netlify original.
export default { fetch: handler };
