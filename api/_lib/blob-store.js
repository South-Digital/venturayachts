import { put as blobPut, get as blobGet } from "@vercel/blob";

// Drop-in replacement for @netlify/blobs' getStore(), so migrating the four
// call sites is a one-line import change each rather than a cache rewrite.
//
// Only the two methods this codebase actually uses are implemented:
//   store.get(key, { consistency })  -> string | null
//   store.set(key, body, { metadata })
//
// Netlify Blobs namespaces by store; Vercel Blob has one flat keyspace per
// store, so the store name becomes a pathname prefix. That keeps the existing
// BOATS_BLOB_STORE / YACHTS_BLOB_STORE separation intact.
//
// `metadata` is accepted and ignored: Vercel Blob has no arbitrary metadata,
// and nothing reads it back — serializeBlobPayload() already embeds the schema
// version and timestamp inside the payload itself.
export function getStore(storeName) {
  const prefix = `${storeName}/`;

  return {
    async get(key, opts = {}) {
      // Netlify's "strong" consistency maps to bypassing Vercel's blob cache.
      // The default is a cached read, which can lag a write by up to 60s.
      const strong = opts?.consistency === "strong";
      const res = await blobGet(prefix + key, {
        access: "private",
        useCache: !strong,
      });
      if (!res || res.statusCode !== 200 || !res.stream) return null;
      // res.stream is a ReadableStream; Response is the portable way to drain it.
      return await new Response(res.stream).text();
    },

    async set(key, body) {
      await blobPut(prefix + key, body, {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json",
      });
    },
  };
}
