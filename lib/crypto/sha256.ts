const K = new Int32Array([%s]);

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
const W = new Int32Array(64);

function compressChain(h: Int32Array, dv: DataView, off: number): void {
  for (let i = 0; i < 16; i++) W[i] = dv.getInt32(off + i * 4, false)
  for (let i = 16; i < 64; i++) {
    const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3)
    const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10)
    W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0
  }
  let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7]
  for (let i = 0; i < 64; i++) {
    const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
    const ch = (e & f) ^ (~e & g)
    const t1 = (hh + S1 + ch + K[i] + W[i]) | 0
    const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
    const maj = (a & b) ^ (a & c) ^ (b & c)
    const t2 = (S0 + maj) | 0
    hh = g; g = f; f = e; e = (d + t1) | 0
    d = c; c = b; b = a; a = (t1 + t2) | 0
  }
  h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0
  h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0
}

/** Compute the SHA-256 digest of a byte array (FIPS 180-4). */
export function sha256Bytes(message: Uint8Array): Uint8Array {
  const h = new Int32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  const len = message.length
  const total = (((len + 8) >> 6) + 1) * 64 // padded length (multiple of 64)
  const buf = new Uint8Array(total)
  buf.set(message)
  buf[len] = 0x80
  const dv = new DataView(buf.buffer)
  dv.setUint32(total - 8, Math.floor(len / 0x20000000), false) // high 32 bits of bit length
  dv.setUint32(total - 4, (len << 3) >>> 0, false) // low 32 bits of bit length
  for (let off = 0; off < total; off += 64) compressChain(h, dv, off)
  const out = new Uint8Array(32)
  const odv = new DataView(out.buffer)
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i] >>> 0, false)
  return out
}

const utf8 = new TextEncoder()

/** Lowercase hex encoding of a byte array. */
export function toHex(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += b.toString(16).padStart(2, '0')
  return s
}

/** Decode a hex string (tolerates an "sha256-" prefix). */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/^sha\d{2}-/i, '').toLowerCase()
  if (!/^([0-9a-f][0-9a-f])*$/.test(clean)) throw new Error('invalid hex string')
  const out = new Uint8Array(clean.length >> 1)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

/** SHA-256 of a UTF-8 string, lowercase hex. */
export function sha256Hex(message: string): string {
  return toHex(sha256Bytes(utf8.encode(message)))
}

/** SubtleCrypto fast path when available; deterministic pure-JS fallback otherwise. */
export async function subtleSha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const g = globalThis as { crypto?: Crypto }
  if (g.crypto?.subtle) {
    try {
      const buf = data instanceof Uint8Array ? Uint8Array.from(data).buffer : data
      const digest = await g.crypto.subtle.digest('SHA-256', buf)
      return toHex(new Uint8Array(digest))
    } catch {
      /* insecure origin or unsupported — fall through to pure JS */
    }
  }
  return toHex(sha256Bytes(data instanceof Uint8Array ? data : new Uint8Array(data)))
}

/* ------------------------------------------------------------------ */
/* Verification primitives                                             */
/* ------------------------------------------------------------------ */

/** Constant-time hex comparison — never leaks the position of the first mismatch. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  const x = a.toLowerCase().replace(/^sha\d{2}-/, '')
  const y = b.toLowerCase().replace(/^sha\d{2}-/, '')
  if (x.length !== y.length || x.length === 0 || !/^[0-9a-f]*$/.test(x) || !/^[0-9a-f]*$/.test(y)) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i)
  return diff === 0
}

export type DigestResult = { ok: boolean; expected: string; actual: string; algorithm: 'sha256' }

/** Verify a downloaded blob against the expected SHA-256 fingerprint. */
export async function verifyDigest(blob: ArrayBuffer | Uint8Array, expected: string): Promise<DigestResult> {
  const actual = await subtleSha256Hex(blob)
  return { ok: timingSafeEqualHex(expected, actual), expected, actual, algorithm: 'sha256' }
}

/* ------------------------------------------------------------------ */
/* Merkle tree (release-manifest anchoring)                            */
/* ------------------------------------------------------------------ */

export function merkleRoot(hashes: readonly string[]): string {
  if (hashes.length === 0) return sha256Hex('')
  let level = [...hashes]
  while (level.length > 1) {
    const next: string[] = []
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i]
      const b = i + 1 < level.length ? level[i + 1] : level[i]
      next.push(sha256Hex(a + b))
    }
    level = next
  }
  return level[0]
}

export function merkleProof(hashes: readonly string[], index: number): string[] {
  const proof: string[] = []
  let level = [...hashes]
  let idx = index
  while (level.length > 1) {
    const sibling = idx % 2 === 0 ? (idx + 1 < level.length ? idx + 1 : idx) : idx - 1
    proof.push(level[sibling])
    const next: string[] = []
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i]
      const b = i + 1 < level.length ? level[i + 1] : level[i]
      next.push(sha256Hex(a + b))
    }
    level = next
    idx = idx >> 1
  }
  return proof
}

export function merkleVerify(leaf: string, index: number, proof: readonly string[], root: string): boolean {
  let cur = leaf
  let idx = index
  for (const p of proof) {
    cur = idx % 2 === 0 ? sha256Hex(cur + p) : sha256Hex(p + cur)
    idx = idx >> 1
  }
  return timingSafeEqualHex(cur, root)
}

/* ------------------------------------------------------------------ */
/* Runtime self-test (NIST FIPS 180-4 example vectors)                 */
/* ------------------------------------------------------------------ */

export function sha256SelfTest(): boolean {
  const vectorEmpty = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  const vectorAbc = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  const vectorTwoBlocks = '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
  const million = new Uint8Array(1_000_000).fill(0x61)
  const vectorMillion = 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0'
  return (
    toHex(sha256Bytes(new Uint8Array(0))) === vectorEmpty &&
    sha256Hex('abc') === vectorAbc &&
    sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq') === vectorTwoBlocks &&
    toHex(sha256Bytes(million)) === vectorMillion
  )
}
