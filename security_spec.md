# Firestore Security Specification & Hardening Matrix

## 1. Data Invariants

1. **Identity & Ownership Integrity**: A user can never author, mutate, or inject records (`/users/{userId}`) where `userId != request.auth.uid`.
2. **Interpreter Profile Protection**: Only authenticated interpreters can create their own profile `/interpreters/{interpreterId}` matching their `auth.uid`. Rates cannot be negative, and roles cannot be spoofed.
3. **Session Participant Isolation**: Sessions `/sessions/{sessionId}` are strictly constrained so that reads and updates can only be executed by verified participants (`userId == request.auth.uid || interpreterId == request.auth.uid`) or authorized system administrators.
4. **Action-Based Update Lock**: Updates to `/sessions/{sessionId}` must enforce strict allowed keys (`status`, `interpreterId`, `startedAt`, `endedAt`, `durationMinutes`, `totalCost`, etc.). Terminal session states (`completed`, `cancelled`) cannot have core metadata overwritten.
5. **PII Isolation Strategy**: Sensitive user preferences and payment tokens are strictly isolated within `/users/{userId}/private/{settingId}` and inaccessible to unauthenticated or external users.
6. **Transcript Turn Authenticity**: Live diarized dialogue entries in `/sessions/{sessionId}/transcript/{entryId}` can only be appended if the caller is an active participant in that parent session document.
7. **Escrow Financial Ledger Security**: Ledger records in `/transactions/{transactionId}` cannot be created or altered directly by clients; they require admin verification or secure backend authority.
8. **Catch-All Default Deny**: All unmapped paths are closed by default via `match /{document=**} { allow read, write: if false; }`.

---

## 2. The "Dirty Dozen" Threat Payloads (Negative Tests)

The following 12 payloads must be strictly blocked with `PERMISSION_DENIED`:

1. **Payload 1 (User ID Spoofing)**:
   - Operation: `CREATE /users/attacker_uid` with `{ userId: 'victim_uid', name: 'Victim', role: 'user_deaf', primaryLanguage: 'ASL', availableStatus: 'online' }`
   - Expected: `PERMISSION_DENIED` (UID mismatch with path).

2. **Payload 2 (Ghost Field Injection during User Update)**:
   - Operation: `UPDATE /users/{userId}` with `{ isAdmin: true, bypassEscrow: true }`
   - Expected: `PERMISSION_DENIED` (Disallowed keys outside schema allowlist).

3. **Payload 3 (Unauthenticated Read on Private Settings)**:
   - Operation: `GET /users/{targetUserId}/private/settings` with unauthenticated client.
   - Expected: `PERMISSION_DENIED` (Requires `isOwner(userId)`).

4. **Payload 4 (External User PII Reading)**:
   - Operation: `GET /users/user_victim/private/settings` with `request.auth.uid = 'user_attacker'`
   - Expected: `PERMISSION_DENIED` (Cannot read non-owned private data).

5. **Payload 5 (Impersonate Interpreter Registration)**:
   - Operation: `CREATE /interpreters/target_interpreter_id` with `{ interpreterId: 'different_id', name: 'Fake RN', ratePerHour: -50 }`
   - Expected: `PERMISSION_DENIED` (Negative rate & ID mismatch).

6. **Payload 6 (Unauthorized Session Eavesdropping)**:
   - Operation: `GET /sessions/confidential_session_123` by a user neither `userId` nor `interpreterId`.
   - Expected: `PERMISSION_DENIED` (Non-participant read rejected).

7. **Payload 7 (Orphaned Session Transcript Injection)**:
   - Operation: `CREATE /sessions/unauthorized_sess/transcript/turn_01` by non-participant.
   - Expected: `PERMISSION_DENIED` (Parent session validation gate).

8. **Payload 8 (Client Modification of Financial Ledger)**:
   - Operation: `CREATE /transactions/tx_fake_payout` by regular authenticated user.
   - Expected: `PERMISSION_DENIED` (Only admin / server webhook allowed).

9. **Payload 9 (Oversized Payload / Denial of Wallet Attack)**:
   - Operation: `UPDATE /users/{userId}` with a 2MB string in `name` exceeding 100 character size limit.
   - Expected: `PERMISSION_DENIED` (`data.name.size() <= 100` failed).

10. **Payload 10 (Dictionary Vocabulary Tampering)**:
    - Operation: `UPDATE /dictionary/asl-hello` with altered gesture definitions by standard client.
    - Expected: `PERMISSION_DENIED` (Dictionary write reserved for admins/linguists).

11. **Payload 11 (Dispatch Queue Hijacking)**:
    - Operation: `CREATE /dispatchQueue/dq_101` with `userId` of another user.
    - Expected: `PERMISSION_DENIED` (`incoming().userId == request.auth.uid` failed).

12. **Payload 12 (Session Review Forgery)**:
    - Operation: `CREATE /interpreters/int_01/reviews/rev_99` with `rating: 10` (out of range) and mismatched reviewer UID.
    - Expected: `PERMISSION_DENIED` (`rating >= 1 && rating <= 5` and reviewer verification failed).
