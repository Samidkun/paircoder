# Paircoder — Design Spec
Date: 2026-09-29
Tier: T0 / Ceremony M
Status: APPROVED (pending mockup ACC)

---

## 1. Problem & Goal

Real-time collaborative coding interview platform. Interviewer creates a room,
shares a link to a candidate, they code together live. After the session:
interviewer can replay every keystroke and fill a scorecard shareable to a
hiring manager — without signup.

Target user: a single interviewer (freelancer, startup hiring manager) running
technical interviews without paying for CoderPad.

---

## 2. Stack

| Layer | Choice | Reason |
|---|---|---|
| Backend | Laravel 12 + Reverb | Native WebSocket, zero extra process |
| Frontend | React 19 + TypeScript + Tailwind 4 | Porto standard |
| Collab | Yjs + CodeMirror 6 | Mature CRDT + CM binding, lighter than Monaco |
| Execution | Judge0 public API | Free, no infra |
| DB | PostgreSQL | Porto standard |
| Auth | Laravel Fortify | Session-based, no JWT complexity |

---

## 3. DB Schema

```sql
users          (id uuid, email, password, name, timestamps)
rooms          (id uuid, user_id fk, slug varchar(12) unique,
                language varchar(20), status enum(waiting/active/ended),
                started_at, ended_at, timestamps)
participants   (id uuid, room_id fk, name, is_interviewer bool,
                color varchar(7), joined_at, left_at)
keystrokes     (id bigserial, room_id fk, participant_id fk,
                delta jsonb, ts_ms bigint, created_at)
scorecards     (id uuid, room_id fk, problem_solving 1-5,
                code_quality 1-5, communication 1-5, speed 1-5,
                notes text, share_token varchar(32) unique, timestamps)
```

---

## 4. API Contract (FROZEN)

```
Auth
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/logout

Rooms
  GET  /api/rooms
  POST /api/rooms
  GET  /api/rooms/{slug}
  POST /api/rooms/{slug}/end

Participants
  POST /api/rooms/{slug}/join   -- kandidat join, isi nama, return token

Execution
  POST /api/rooms/{slug}/run    -- proxy Judge0, rate-limited 10/min/room

Replay
  GET  /api/rooms/{slug}/replay -- return keystrokes[] ordered by ts_ms

Scorecard
  POST /api/rooms/{slug}/scorecard
  GET  /api/rooms/{slug}/scorecard
  GET  /api/scorecards/{share_token}   -- public no-auth
```

WebSocket (Reverb):
```
room.{slug}          -- presence + Yjs relay + status events
room.{slug}.private  -- interviewer-only notes sync
```

---

## 5. Screen Inventory

| # | Screen | Auth |
|---|---|---|
| 1 | Landing | public |
| 2 | Auth (login/register tab) | guest only |
| 3 | Dashboard | interviewer |
| 4 | Room Lobby | interviewer |
| 5 | Room Active | interviewer + kandidat |
| 6 | Replay | interviewer |
| 7 | Scorecard (form + public view) | interviewer / public token |

---

## 6. User Flow

```
Interviewer: Login → Dashboard → New Room → Room Lobby
             → share link ke kandidat
Kandidat:    buka link → isi nama → Room Active
Berdua:      code bareng, run, lihat output
Interviewer: End Session → isi Scorecard → share scorecard link
             → bisa Replay kapanpun
Hiring Mgr:  buka scorecard link (no auth)
```

---

## 7. Subagent Wave Plan

Wave 1 (paralel):
- SA-1 auth-room-core   : schema, migration, User/Room/Participant models, auth API, room CRUD
- SA-2 editor-collab    : React + CodeMirror 6 + Yjs + Reverb bridge + presence cursors
- SA-3 execution-engine : Judge0 proxy, language mapping, rate limit, output panel

Wave 2 (setelah Wave 1 selesai, paralel):
- SA-4 replay-engine    : keystroke storage, GET replay, replay UI + scrubber
- SA-5 scorecard        : scorecard CRUD, share token, public view
- SA-6 ui-shell         : Landing, Auth, Dashboard, Lobby, Room Active layout, design system

---

## 8. EARS Acceptance Criteria

AC-1  WHEN a guest opens the landing THEN a "Start Interview" CTA routes to /login.
AC-2  WHEN an interviewer submits register THEN account is created and redirected to /dashboard.
AC-3  WHEN an interviewer creates a room THEN a unique 12-char slug is returned and room status is 'waiting'.
AC-4  WHEN a candidate opens /room/{slug}/join and submits name THEN they enter the room and appear in presence list.
AC-5  WHEN both users are in a room THEN keystrokes in CodeMirror sync in real-time via Yjs/Reverb.
AC-6  WHEN a user selects a language THEN CodeMirror syntax highlighting switches accordingly.
AC-7  WHEN a user clicks Run THEN code is sent to Judge0 and stdout/stderr appears in output panel within 10s.
AC-8  WHEN the interviewer clicks End Session THEN room status changes to 'ended' and candidate is redirected.
AC-9  WHEN the interviewer opens Replay THEN keystrokes play back in correct order at selected speed.
AC-10 WHEN the interviewer submits a scorecard THEN a unique share_token is generated.
AC-11 WHEN a hiring manager opens /scorecards/{token} THEN the scorecard is visible without login.
AC-12 WHEN a room receives >10 run requests/min THEN the 11th returns HTTP 429.
AC-13 WHEN two users type simultaneously THEN Yjs CRDT resolves without conflict (no data loss).

---

## 9. Out of Scope (v1.0.0)

- Video/audio call
- Whiteboard
- AI scoring
- Custom test cases beyond stdin
- Multiple concurrent rooms per session
