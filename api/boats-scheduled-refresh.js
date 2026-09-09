import { getCachedBaseDataset } from "./_boats/shared.js";

export default async () => {
  await getCachedBaseDataset({ forceRefresh: true });
};

// The schedule lives in vercel.json ("crons"), not here — Vercel invokes this
// path by HTTP rather than reading a config export. Kept at */30 UTC, as before.
