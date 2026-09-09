import {
  getCachedBaseDataset,
  jsonResponse,
  corsPreflightResponse,
  corsGuardResponse,
} from "./_boats/shared.js";

function normalizeBrand(value) {
  if (value == null) return "";
  return value.toString().trim().replace(/\s+/g, " ");
}

const handler = async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return corsPreflightResponse(req);
    }

    const corsGuard = corsGuardResponse(req);
    if (corsGuard) {
      return corsGuard;
    }

    const base = await getCachedBaseDataset();
    const seen = new Map();

    for (const boat of base?.data || []) {
      const brand = normalizeBrand(boat?.make);
      if (!brand) continue;
      const key = brand.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, brand);
      }
    }

    const brands = Array.from(seen.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );

    return jsonResponse({
      meta: {
        last_updated: base?.last_updated ?? null,
        stale: base?.stale ?? false,
        source_status: base?.source_status ?? null,
        total: brands.length,
      },
      data: brands,
    }, 200, {}, req);
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
