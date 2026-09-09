import {
  getCachedBaseDataset,
  applyQueryFiltering,
  jsonResponse,
  corsPreflightResponse,
  corsGuardResponse,
} from "./_boats/shared.js";

const handler = async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return corsPreflightResponse(req);
    }

    const corsGuard = corsGuardResponse(req);
    if (corsGuard) {
      return corsGuard;
    }

    const url = new URL(req.url);

    // If netlify.toml rewrite is used, detail calls arrive as ?id=<splat>
    const id =
      url.searchParams.get("id") ||
      url.searchParams.get("boat_id") ||
      url.searchParams.get("boatid");

    const base = await getCachedBaseDataset();

    if (id) {
      const targetId = id.toString().trim().replace(/\/+$/, "");
      const normalizedId = targetId.includes(":") ? targetId.split(":").pop() : targetId;

      const found = (base.data || []).find(
        (b) =>
          (b?.boat_id != null && b.boat_id.toString() === normalizedId) ||
          (b?.yachtworld_id != null && b.yachtworld_id.toString() === normalizedId)
      );

      if (!found) {
        return jsonResponse({ error: "Not found", id: normalizedId }, 404, {}, req);
      }

      return jsonResponse({
        meta: {
          last_updated: base.last_updated,
          stale: base.stale,
          source_status: base.source_status,
        },
        data: found,
      }, 200, {}, req);
    }

    // List route
    const filtered = applyQueryFiltering(base, url);
    return jsonResponse(filtered, 200, {}, req);
  } catch (e) {
    return jsonResponse({ error: e?.message || "Unexpected error" }, 500, {}, req);
  }
};

// Vercel's Node runtime treats a bare default-exported function as the legacy
// (req, res) Node handler: it would be invoked with IncomingMessage/ServerResponse,
// the returned Response would be discarded and the request would hang until it
// failed with FUNCTION_INVOCATION_FAILED. Exporting an object with a `fetch`
// method is the documented Web-standard shape, and it keeps the handler above
// byte-for-byte identical to the Netlify original.
export default { fetch: handler };
