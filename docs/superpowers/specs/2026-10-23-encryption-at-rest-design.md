# Backend Encryption At Rest

## Intent

Protect the requested student data and stored session summaries if MongoDB is
copied or exposed, without changing the current AI summary, login, password
reset, email, counselor, or administrator flows.

## Scope

Encrypt these User fields at rest:

- `studentId`
- `fullName`
- `email`
- `phone`

Encrypt `SessionSummary.summary` at rest.

Encrypt the duplicate `EmailVerification.email` value as well, with an
`emailLookup` digest, so the verification collection does not remain a
plaintext email escape hatch.

Counselor fields, chat messages, appointment concerns, audit trails, and files
are out of scope for this change. Existing authorization rules remain the
source of truth for who can receive decrypted data through the API.

## Design

Use Node's built-in `crypto` module and AES-256-GCM. The key is supplied only
to the backend through `DATA_ENCRYPTION_KEY` as a 64-character hex value. Each
value gets a fresh random 12-byte IV. Stored values use a versioned format:

`v1.<iv>.<authTag>.<ciphertext>`

The encryption helper must authenticate and reject malformed or tampered
values. It may read existing plaintext values during the migration window, but
every new or modified value must be encrypted. The backend must fail startup
when `DATA_ENCRYPTION_KEY` is missing or invalid. A live request that cannot
decrypt a stored value fails closed with a generic server error and logs only
the record type/id, never the value or key.

`studentId` and `email` need server-side lookup without storing plaintext.
Normalize Student IDs with trimming and emails with trimming plus lowercase.
Store keyed HMAC-SHA-256 digests in `studentIdLookup` and `emailLookup`, using
domain-separated derivation from the same backend key. These fields are
internal, excluded from serialized responses, and indexed. Login, uniqueness
checks, password reset, email verification, and newsletter delivery use the
digests and decrypt only after a matching account is found.

`studentIdLookup` and `emailLookup` are unique sparse indexes. The migration
must report duplicate canonical values and stop before creating or relying on
the unique indexes; duplicates require manual resolution rather than silently
choosing an account.

Model getters and JSON/object serialization should transparently decrypt User,
EmailVerification, and SessionSummary values. Validation must run against
plaintext values, not ciphertext lengths. Lean queries must explicitly enable
getters so existing response shapes remain unchanged. Query filters must use
lookup digests rather than encrypted values, because randomized encryption is
not searchable.

## Migration

Add a one-time `backend/scripts/encryptSensitiveData.mjs` script. It will:

1. Require `DATA_ENCRYPTION_KEY`.
2. Process User documents in batches.
3. Encrypt plaintext sensitive fields and populate lookup digests.
4. Encrypt plaintext session summaries.
5. Report counts and failures, and stop on a failed document.

The script must be safe to rerun: already encrypted values are left intact,
while missing lookup digests are repaired. Back up MongoDB before running it.
Deploy the new backend and stop old writers before running the migration; the
temporary plaintext-read compatibility is for migration safety, not for
running old and new writers indefinitely.

## Key Handling

The key must never be committed, returned by an endpoint, logged, or stored in
MongoDB. Losing or replacing it makes encrypted values unrecoverable. Key
rotation is deliberately out of scope; a future rotation must decrypt with the
old key and re-encrypt with the new key in a controlled migration.

## Compatibility

- Login keeps accepting the existing Student ID input and resolves it through
  `studentIdLookup`.
- Existing numeric Mongo `_id` fallback remains unchanged.
- Password reset and verification continue to email decrypted account data.
- Backend AI summary generation continues unchanged; only its stored result is
  encrypted after generation.
- API response field names and frontend behavior remain unchanged.
- Existing plaintext documents remain readable until the migration runs.

## Non-goals

- End-to-end encryption or frontend-held keys.
- Encrypting passwords, TOTP secrets, or JWT cookies differently; those already
  use hashing, existing AES-GCM, or HTTP-only cookies.
- Hiding data from an authorized backend process, since the selected design is
  encryption at rest rather than frontend-only decryption.

## Verification

- Unit checks cover round-trip encryption, random ciphertexts, tamper rejection,
  lookup digest normalization, and plaintext migration compatibility.
- Backend syntax checks cover changed controllers, models, the migration, and
  the crypto helper.
- Frontend build verifies unchanged API response compatibility.
