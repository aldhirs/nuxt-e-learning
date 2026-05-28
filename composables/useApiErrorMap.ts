import type { ApiError } from '~/composables/useApi'

/**
 * Maps a backend error envelope to:
 *   - per-field messages (for inline display on form inputs)
 *   - a global message (for the top-of-form banner)
 *
 * Backend error envelope (deployed shape):
 *   {
 *     code: 1001,
 *     message: "Input validation failed",
 *     details: { field: "request" | "<field-name>", reason: "...", suggest: "..." }
 *   }
 *
 * Also handles the contract shape:
 *   { code: "...", message, fields: { <field>: <msg> } }
 *
 * When details.field === "request" (generic), the reason text is heuristically
 * matched against known field names so e.g. "email already exists" lands on
 * the `email` input.
 *
 * @param err     The thrown ApiError from useApi.
 * @param fields  Names of known form fields to map against (e.g. ['email','username']).
 */
export function mapApiError(
  err: unknown,
  fields: string[] = []
): { global: string; perField: Record<string, string> } {
  const e = err as ApiError | undefined
  const perField: Record<string, string> = {}
  let global = ''

  if (!e) return { global: 'Something went wrong. Please try again.', perField }

  // 1. Explicit per-field map from BE (contract shape) — highest priority
  if (e.fields && Object.keys(e.fields).length > 0) {
    for (const [k, v] of Object.entries(e.fields)) {
      if (fields.includes(k)) perField[k] = v
    }
  }

  // 2. details.field hint (deployed shape)
  const payloadDetails = e.payload?.details
  if (payloadDetails?.field && payloadDetails.field !== 'request') {
    const f = payloadDetails.field
    if (fields.includes(f) && !perField[f]) {
      perField[f] = payloadDetails.reason || e.message || 'Invalid value'
    }
  }

  // 3. Heuristic: scan reason text for known field names when field is generic
  const reason = (e.reason || '').toLowerCase()
  const msg    = (e.message || '').toLowerCase()
  if (Object.keys(perField).length === 0 && (reason || msg)) {
    for (const f of fields) {
      // mention: "email already exists", "invalid password", etc.
      if (reason.includes(f) || msg.includes(f)) {
        perField[f] = e.reason || e.message || 'Invalid value'
        break
      }
    }
  }

  // 4. Global message — always present so banner shows something useful
  if (Object.keys(perField).length === 0) {
    // No field mapped: show server reason or message
    global = e.reason || e.message || 'Failed to process request. Please try again.'
  } else {
    // Field mapped: still surface the high-level message at the top
    global = e.message || e.reason || ''
  }

  // Network / unknown failures
  if (e.status === 0) {
    global = 'Unable to connect to server. Check your internet connection.'
  }

  return { global, perField }
}
