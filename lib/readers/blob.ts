/**
 * Server-only Blob fetch helper.
 *
 * Fetches JSON blobs from a public Vercel Blob URL derived from the
 * `BLOB_PUBLIC_READ_URL` env var.
 *
 * The env var holds the public base URL for the bucket, e.g.
 *   https://public.vercel-blob.com/<team>/<bucket>
 * The full object URL is constructed as: ${BLOB_PUBLIC_READ_URL}/${path}
 *
 * We deliberately do NOT use BLOB_READ_WRITE_TOKEN here because:
 *   - that token is for *write* operations
 *   - for a read-only dashboard a public URL is sufficient
 *   - write tokens add unnecessary attack surface even server-side
 *
 * If BLOB_PUBLIC_READ_URL is not set the function returns usingFallback=true,
 * signalling callers to load fixture data instead.
 *
 * The caller passes the relative path within the bucket, e.g.
 *   "games-dashboard/v1/played/latest.json"
 */

const BLOB_PUBLIC_READ_URL = process.env.BLOB_PUBLIC_READ_URL;

interface BlobFetchOptions {
  path: string;
}

interface BlobFetchResult {
  data: unknown;
  usingFallback: boolean;
}

/**
 * Fetch and parse a JSON blob from the public Blob URL.
 *
 * Returns { data, usingFallback: false } on success.
 * Returns { data: null, usingFallback: true } when BLOB_PUBLIC_READ_URL
 * is not set or the fetch fails — callers should fall back to fixture data.
 */
export async function fetchBlobJson<T = unknown>({
  path,
}: BlobFetchOptions): Promise<BlobFetchResult> {
  if (!BLOB_PUBLIC_READ_URL) {
    return { data: null, usingFallback: true };
  }

  // Path must be relative and clean — no absolute URLs or traversal.
  if (!path || path.startsWith('/') || path.includes('..')) {
    throw new Error(`Invalid blob path: ${path}`);
  }

  const url = `${BLOB_PUBLIC_READ_URL.replace(/\/$/, '')}/${path}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      // 404, 500, etc. — treat as unavailable, fall back to fixture
      return { data: null, usingFallback: true };
    }
    const json = (await res.json()) as T;
    return { data: json, usingFallback: false };
  } catch {
    // Network error or malformed JSON — fall back to fixture
    return { data: null, usingFallback: true };
  }
}
