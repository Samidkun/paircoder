# Paircoder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Paircoder, a zero-latency collaborative coding interview platform featuring Yjs CRDT real-time sync, isolated Judge0 code execution, keystroke replay timeline, and public shareable scorecards without login.

**Architecture:** Laravel 12 backend with Reverb WebSockets and PostgreSQL for state, keystroke event logs, and Judge0 proxying. React 19 + TypeScript + Tailwind 4 frontend with CodeMirror 6 and Yjs CRDT for peer collaboration and playback scrubber.

**Tech Stack:** Laravel 12, Laravel Reverb, PostgreSQL, Laravel Fortify, React 19, TypeScript, CodeMirror 6, Yjs (y-codemirror.next, y-websocket/reverb), Tailwind CSS 4, Judge0 CE.

**Spec:** `/mnt/data/01_Projects/Porto/paircoder/docs/superpowers/specs/2026-09-29-paircoder-design.md`

## Global Constraints

- **Language & Stack:** PHP 8.3+ / Laravel 12, Node 22+, React 19, TypeScript, Tailwind 4.
- **Database:** PostgreSQL with UUID primary keys on entities, BigSerial on `keystrokes`.
- **WebSocket Protocol:** Laravel Reverb channels `room.{slug}` (presence + Yjs relay) and `room.{slug}.private` (interviewer notes).
- **Execution Rate Limit:** Exactly 10 runs per minute per room on `POST /api/rooms/{slug}/run`, returning HTTP 429 when exceeded.
- **Scorecard Share Token:** 32-character random string for public unauthenticated access via `GET /api/scorecards/{share_token}`.
- **TDD Requirement:** Every endpoint and feature has failing PHPUnit / Vitest tests written first before implementation.

---

### Task 1: Project Scaffolding & Database Schema (Auth & Room Models)

**Files:**
- Create: `backend/composer.json`, `backend/app/Models/User.php`, `backend/app/Models/Room.php`, `backend/app/Models/Participant.php`, `backend/app/Models/Keystroke.php`, `backend/app/Models/Scorecard.php`
- Create: `backend/database/migrations/2026_09_29_000001_create_paircoder_tables.php`
- Test: `backend/tests/Feature/SchemaAndModelTest.php`

**Interfaces:**
- Consumes: None (root setup)
- Produces: Database tables `users`, `rooms`, `participants`, `keystrokes`, `scorecards` with UUIDs and relationships.

- [ ] **Step 1: Write the failing model test**

Create `backend/tests/Feature/SchemaAndModelTest.php`:
```php
<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\User;
use App\Models\Room;
use App\Models\Participant;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SchemaAndModelTest extends TestCase {
    use RefreshDatabase;

    public function test_room_can_be_created_with_uuid_and_slug(): void {
        $user = User::factory()->create();
        $room = Room::create([
            'user_id' => $user->id,
            'slug' => 'a8f9-c2e1-4b7d',
            'language' => 'typescript',
            'status' => 'waiting',
        ]);
        $this->assertDatabaseHas('rooms', ['slug' => 'a8f9-c2e1-4b7d', 'status' => 'waiting']);
        $this->assertEquals($user->id, $room->user->id);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/SchemaAndModelTest.php`
Expected: FAIL (tables and classes not found).

- [ ] **Step 3: Implement migrations and Eloquent models**

Implement migrations in `backend/database/migrations/2026_09_29_000001_create_paircoder_tables.php`:
```php
Schema::create('rooms', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
    $table->string('slug', 12)->unique();
    $table->string('language', 20)->default('typescript');
    $table->enum('status', ['waiting', 'active', 'ended'])->default('waiting');
    $table->timestamp('started_at')->nullable();
    $table->timestamp('ended_at')->nullable();
    $table->timestamps();
});

Schema::create('participants', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
    $table->string('name');
    $table->boolean('is_interviewer')->default(false);
    $table->string('color', 7)->default('#0071E3');
    $table->timestamp('joined_at')->useCurrent();
    $table->timestamp('left_at')->nullable();
});

Schema::create('keystrokes', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
    $table->foreignUuid('participant_id')->constrained('participants')->cascadeOnDelete();
    $table->jsonb('delta');
    $table->bigInteger('ts_ms');
    $table->timestamp('created_at')->useCurrent();
});

Schema::create('scorecards', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
    $table->unsignedTinyInteger('problem_solving')->default(3);
    $table->unsignedTinyInteger('code_quality')->default(3);
    $table->unsignedTinyInteger('communication')->default(3);
    $table->unsignedTinyInteger('speed')->default(3);
    $table->text('notes')->nullable();
    $table->string('share_token', 32)->unique();
    $table->timestamps();
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/SchemaAndModelTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(core): scaffold database tables and models for paircoder"
```

---

### Task 2: Auth & Room Management API (Fortify, CRUD, Join)

**Files:**
- Create: `backend/app/Http/Controllers/AuthController.php`, `backend/app/Http/Controllers/RoomController.php`, `backend/app/Http/Controllers/ParticipantController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/RoomApiTest.php`

**Interfaces:**
- Consumes: Models `User`, `Room`, `Participant`
- Produces:
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
  - `GET /api/rooms`, `POST /api/rooms`, `GET /api/rooms/{slug}`, `POST /api/rooms/{slug}/end`
  - `POST /api/rooms/{slug}/join`

- [ ] **Step 1: Write failing feature tests**

Create `backend/tests/Feature/RoomApiTest.php`:
```php
<?php
namespace Tests\Feature;
use Tests\TestCase;
use App\Models\User;
use App\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RoomApiTest extends TestCase {
    use RefreshDatabase;

    public function test_interviewer_can_create_room_with_12_char_slug(): void {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/api/rooms', ['language' => 'typescript']);
        $response->assertStatus(201)
                 ->assertJsonStructure(['data' => ['id', 'slug', 'language', 'status']]);
        $this->assertEquals(12, strlen(str_replace('-', '', $response->json('data.slug'))));
    }

    public function test_candidate_can_join_room(): void {
        $user = User::factory()->create();
        $room = Room::create(['user_id' => $user->id, 'slug' => 'a8f9c2e14b7d', 'status' => 'waiting']);
        $response = $this->postJson("/api/rooms/{$room->slug}/join", ['name' => 'Sarah Jenkins']);
        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['participant_id', 'name', 'color', 'token']]);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/RoomApiTest.php`
Expected: FAIL (404 route not found).

- [ ] **Step 3: Implement Auth & Room Controllers**

Implement controllers in `backend/app/Http/Controllers/RoomController.php`:
```php
public function store(Request $request): JsonResponse {
    $request->validate(['language' => 'nullable|string|max:20']);
    $slug = substr(bin2hex(random_bytes(6)), 0, 12);
    $formattedSlug = substr($slug, 0, 4) . '-' . substr($slug, 4, 4) . '-' . substr($slug, 8, 4);

    $room = Room::create([
        'user_id' => $request->user()->id,
        'slug' => $formattedSlug,
        'language' => $request->input('language', 'typescript'),
        'status' => 'waiting',
    ]);
    return response()->json(['data' => $room], 201);
}

public function end(string $slug): JsonResponse {
    $room = Room::where('slug', $slug)->firstOrFail();
    $room->update(['status' => 'ended', 'ended_at' => now()]);
    broadcast(new RoomEndedEvent($room->slug))->toOthers();
    return response()->json(['data' => $room]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/RoomApiTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(api): implement room lifecycle and candidate join API"
```

---

### Task 3: Execution Engine & Judge0 Rate-Limiting Proxy

**Files:**
- Create: `backend/app/Services/Judge0Service.php`, `backend/app/Http/Controllers/ExecutionController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ExecutionRateLimitTest.php`

**Interfaces:**
- Consumes: `POST /api/rooms/{slug}/run` with payload `{ code: string, language: string, stdin?: string }`
- Produces: Judge0 proxy response with stdout, stderr, compile_output, exec_time, rate limit status.

- [ ] **Step 1: Write failing execution and rate-limit test**

Create `backend/tests/Feature/ExecutionRateLimitTest.php`:
```php
public function test_execution_is_rate_limited_to_10_requests_per_minute_per_room(): void {
    $user = User::factory()->create();
    $room = Room::create(['user_id' => $user->id, 'slug' => 'a8f9c2e14b7d', 'status' => 'active']);

    for ($i = 0; $i < 10; $i++) {
        $res = $this->postJson("/api/rooms/{$room->slug}/run", [
            'code' => 'console.log(1)',
            'language' => 'typescript'
        ]);
        $this->assertNotEquals(429, $res->status());
    }

    $eleventh = $this->postJson("/api/rooms/{$room->slug}/run", [
        'code' => 'console.log(1)',
        'language' => 'typescript'
    ]);
    $eleventh->assertStatus(429);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/ExecutionRateLimitTest.php`
Expected: FAIL.

- [ ] **Step 3: Implement rate limiting and Judge0 client**

Implement `ExecutionController.php` with Laravel `RateLimiter`:
```php
$key = 'room-run:' . $room->slug;
if (RateLimiter::tooManyAttempts($key, 10)) {
    return response()->json(['message' => 'Execution limit reached (10 runs/min)'], 429);
}
RateLimiter::hit($key, 60);

$result = $judge0Service->execute($request->input('code'), $request->input('language'), $request->input('stdin'));
return response()->json(['data' => $result]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/ExecutionRateLimitTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(execution): add Judge0 proxy with 10/min room rate limiter"
```

---

### Task 4: Keystroke Event Recording & Replay Engine

**Files:**
- Create: `backend/app/Http/Controllers/ReplayController.php`, `backend/app/Jobs/RecordKeystrokeJob.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ReplayKeystrokeTest.php`

**Interfaces:**
- Consumes: Yjs/Keystroke diff events from Reverb or client batches
- Produces: `GET /api/rooms/{slug}/replay` ordered by `ts_ms ASC`

- [ ] **Step 1: Write failing replay test**

```php
public function test_replay_returns_ordered_keystroke_deltas(): void {
    $user = User::factory()->create();
    $room = Room::create(['user_id' => $user->id, 'slug' => 'replay-test-slug']);
    $participant = Participant::create(['room_id' => $room->id, 'name' => 'Sarah']);

    Keystroke::create(['room_id' => $room->id, 'participant_id' => $participant->id, 'delta' => ['insert' => 'def'], 'ts_ms' => 2000]);
    Keystroke::create(['room_id' => $room->id, 'participant_id' => $participant->id, 'delta' => ['insert' => 'abc'], 'ts_ms' => 1000]);

    $res = $this->actingAs($user)->getJson("/api/rooms/{$room->slug}/replay");
    $res->assertStatus(200);
    $this->assertEquals(1000, $res->json('data.0.ts_ms'));
    $this->assertEquals(2000, $res->json('data.1.ts_ms'));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/ReplayKeystrokeTest.php`
Expected: FAIL.

- [ ] **Step 3: Implement Replay API**

Implement in `backend/app/Http/Controllers/ReplayController.php`:
```php
public function index(string $slug): JsonResponse {
    $room = Room::where('slug', $slug)->firstOrFail();
    $keystrokes = Keystroke::where('room_id', $room->id)
        ->orderBy('ts_ms', 'asc')
        ->with('participant:id,name,color')
        ->get(['id', 'participant_id', 'delta', 'ts_ms']);
    return response()->json(['data' => $keystrokes]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/ReplayKeystrokeTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(replay): implement ordered keystroke deltas retrieval"
```

---

### Task 5: Scorecard Generation & Public No-Auth Share Token

**Files:**
- Create: `backend/app/Http/Controllers/ScorecardController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ScorecardShareTest.php`

**Interfaces:**
- Consumes: Room ID, 4 scoring parameters (1-5), notes
- Produces:
  - `POST /api/rooms/{slug}/scorecard`
  - `GET /api/scorecards/{share_token}` (Public no-auth)

- [ ] **Step 1: Write failing scorecard test**

```php
public function test_public_can_view_scorecard_via_32_char_token_without_auth(): void {
    $user = User::factory()->create();
    $room = Room::create(['user_id' => $user->id, 'slug' => 'score-room']);
    $token = Str::random(32);
    Scorecard::create([
        'room_id' => $room->id,
        'problem_solving' => 5,
        'code_quality' => 4,
        'communication' => 5,
        'speed' => 4,
        'notes' => 'Exceptional candidate.',
        'share_token' => $token
    ]);

    // Unauthenticated request
    $response = $this->getJson("/api/scorecards/{$token}");
    $response->assertStatus(200)
             ->assertJsonPath('data.problem_solving', 5)
             ->assertJsonPath('data.notes', 'Exceptional candidate.');
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/ScorecardShareTest.php`
Expected: FAIL.

- [ ] **Step 3: Implement Scorecard Controller**

Implement in `backend/app/Http/Controllers/ScorecardController.php`:
```php
public function showPublic(string $token): JsonResponse {
    $scorecard = Scorecard::where('share_token', $token)
        ->with(['room.participants', 'room.user:id,name'])
        ->firstOrFail();
    return response()->json(['data' => $scorecard]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && ./vendor/bin/phpunit tests/Feature/ScorecardShareTest.php`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(scorecard): add evaluation ratings and public 32-char share token endpoint"
```

---

### Task 6: Frontend React 19 UI & Real-Time CodeMirror 6 + Yjs Collab

**Files:**
- Create: `frontend/src/components/Editor/CollabEditor.tsx`, `frontend/src/components/Replay/ReplayScrubber.tsx`, `frontend/src/components/Scorecard/ScorecardView.tsx`
- Create: `frontend/src/pages/Landing.tsx`, `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/Lobby.tsx`, `frontend/src/pages/RoomActive.tsx`
- Test: `frontend/src/components/Editor/CollabEditor.test.tsx`

**Interfaces:**
- Consumes: Yjs Doc, CodeMirror 6 State, Reverb WebSocket connection
- Produces: Collaborative editor with real-time remote cursors, Judge0 output display, and timeline replay.

- [ ] **Step 1: Write frontend editor integration test**

```tsx
import { render, screen } from '@testing-library/react';
import { CollabEditor } from './CollabEditor';

test('renders editor with remote participant presence cursors', () => {
  render(<CollabEditor roomId="a8f9-c2e1-4b7d" username="Dimas" language="typescript" />);
  expect(screen.getByText(/Yjs Synchronized/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement CollabEditor with Yjs and CodeMirror 6**

Wire `y-codemirror.next`, `yjs`, and Reverb WebSocket provider with awareness presence (remote user badges & cursor coloring).

- [ ] **Step 3: Implement 7 UI screens matching mockup.html design anchor**

Integrate Landing, Auth, Dashboard, Lobby, Room Active, Replay, and Scorecard views with Apple/Craft styling (`#F5F5F7`, white elevated cards, hairline borders).

- [ ] **Step 4: Run frontend tests & build**

Run: `cd frontend && pnpm test && pnpm build`
Expected: PASS without TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(ui): implement React 19 + CodeMirror 6 Yjs collaborative editor and 7 screens"
```

---

### Task 7: End-to-End Verification (AC-1 to AC-13)

**Files:**
- Create: `tests/e2e/interview-flow.spec.ts`
- Test: Full Playwright E2E suite

**Interfaces:**
- Consumes: Running backend (port 8000), frontend (port 5173), Reverb (port 8080)
- Produces: Verified acceptance criteria AC-1 through AC-13.

- [ ] **Step 1: Write Playwright test simulating Interviewer and Candidate**

Cover the complete flow:
1. Interviewer logs in & creates room.
2. Candidate joins via `/room/{slug}/join`.
3. Candidate and Interviewer type concurrently; verify zero text conflicts.
4. Run Judge0 execution and verify output within 10s.
5. End session, fill scorecard, verify public share link works without auth.
6. Verify replay scrubber replays typed keystrokes.

- [ ] **Step 2: Run Playwright test suite**

Run: `pnpm exec playwright test`
Expected: 13/13 test cases passed.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/
git commit -m "test(e2e): verify all 13 acceptance criteria AC-1 to AC-13"
```
