<?php

namespace Tests\Feature;

use App\Events\ParticipantJoinedEvent;
use App\Events\RoomEndedEvent;
use App\Models\Keystroke;
use App\Models\Participant;
use App\Models\Room;
use App\Models\Scorecard;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AcceptanceCriteriaVerificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * AC-2: WHEN an interviewer submits register THEN account is created and redirected to /dashboard.
     */
    public function test_ac2_register_interviewer(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Dimas Arya',
            'email' => 'dimas@paircoder.dev',
            'password' => 'secret12345!',
            'password_confirmation' => 'secret12345!',
        ]);

        $this->assertTrue(in_array($response->status(), [200, 201, 302]));
        $this->assertDatabaseHas('users', ['email' => 'dimas@paircoder.dev']);
    }

    /**
     * AC-3: WHEN an interviewer creates a room THEN a unique 12-char slug is returned and room status is 'waiting'.
     */
    public function test_ac3_create_room(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $res = $this->postJson('/api/rooms', ['language' => 'typescript']);
        $res->assertStatus(201);

        $slug = $res->json('data.slug');
        $cleanSlug = str_replace('-', '', $slug);
        $this->assertEquals(12, strlen($cleanSlug));
        $this->assertEquals('waiting', $res->json('data.status'));
    }

    /**
     * AC-4: WHEN a candidate opens /room/{slug}/join and submits name THEN they enter the room.
     */
    public function test_ac4_candidate_join_room(): void
    {
        Event::fake([ParticipantJoinedEvent::class]);

        $user = User::factory()->create();
        $room = Room::create(['user_id' => $user->id, 'slug' => 'test-join-ac4', 'status' => 'waiting']);

        $res = $this->postJson("/api/rooms/{$room->slug}/join", ['name' => 'Sarah Jenkins']);
        $res->assertStatus(200);
        $this->assertEquals('Sarah Jenkins', $res->json('data.name'));
        $this->assertEquals('active', $room->fresh()->status);
        Event::assertDispatched(ParticipantJoinedEvent::class);
    }

    /**
     * AC-7: WHEN a user clicks Run THEN code is sent to Judge0 and stdout/stderr appears in output panel within 10s.
     */
    public function test_ac7_run_code_execution(): void
    {
        Http::fake([
            '*' => Http::response([
                'status' => ['id' => 3, 'description' => 'Accepted'],
                'stdout' => "Test OK: Result 42\n",
                'stderr' => '',
                'time' => '0.015',
                'memory' => 8400,
            ], 200),
        ]);

        $user = User::factory()->create();
        $room = Room::create(['user_id' => $user->id, 'slug' => 'exec-ac7', 'status' => 'active']);

        $res = $this->postJson("/api/rooms/{$room->slug}/run", [
            'code' => 'console.log(42);',
            'language' => 'typescript',
        ]);

        $res->assertStatus(200);
        $this->assertStringContainsString('Result 42', $res->json('data.stdout'));
    }

    /**
     * AC-8: WHEN the interviewer clicks End Session THEN room status changes to 'ended'.
     */
    public function test_ac8_end_session(): void
    {
        Event::fake([RoomEndedEvent::class]);

        $user = User::factory()->create();
        $room = Room::create(['user_id' => $user->id, 'slug' => 'end-ac8', 'status' => 'active']);
        Sanctum::actingAs($user);

        $res = $this->postJson("/api/rooms/{$room->slug}/end");
        $res->assertStatus(200);
        $this->assertEquals('ended', $room->fresh()->status);
        Event::assertDispatched(RoomEndedEvent::class);
    }

    /**
     * AC-9: WHEN the interviewer opens Replay THEN keystrokes play back in correct order.
     */
    public function test_ac9_keystrokes_playback_order(): void
    {
        $user = User::factory()->create();
        $room = Room::create(['user_id' => $user->id, 'slug' => 'replay-ac9']);
        $participant = Participant::create(['room_id' => $room->id, 'name' => 'Budi']);

        Keystroke::create(['room_id' => $room->id, 'participant_id' => $participant->id, 'delta' => ['text' => 'B'], 'ts_ms' => 500]);
        Keystroke::create(['room_id' => $room->id, 'participant_id' => $participant->id, 'delta' => ['text' => 'A'], 'ts_ms' => 100]);
        Keystroke::create(['room_id' => $room->id, 'participant_id' => $participant->id, 'delta' => ['text' => 'C'], 'ts_ms' => 900]);

        $res = $this->getJson("/api/rooms/{$room->slug}/replay");
        $res->assertStatus(200);
        $deltas = $res->json('data');
        $this->assertEquals(100, $deltas[0]['ts_ms']);
        $this->assertEquals(500, $deltas[1]['ts_ms']);
        $this->assertEquals(900, $deltas[2]['ts_ms']);
    }

    /**
     * AC-10 & AC-11: Scorecard submit produces 32-char token, readable without login.
     */
    public function test_ac10_ac11_scorecard_share_token_public(): void
    {
        $user = User::factory()->create();
        $room = Room::create(['user_id' => $user->id, 'slug' => 'score-ac10']);
        Sanctum::actingAs($user);

        $submitRes = $this->postJson("/api/rooms/{$room->slug}/scorecard", [
            'problem_solving' => 5,
            'code_quality' => 5,
            'communication' => 4,
            'speed' => 5,
            'notes' => 'Exceptional coding velocity and problem decomposition.',
        ]);

        $submitRes->assertStatus(201);
        $token = $submitRes->json('data.share_token');
        $this->assertEquals(32, strlen($token));

        // Public check (no auth session)
        $publicRes = $this->getJson("/api/scorecards/{$token}");
        $publicRes->assertStatus(200);
        $this->assertEquals(4.8, $publicRes->json('data.average'));
        $this->assertEquals('Exceptional coding velocity and problem decomposition.', $publicRes->json('data.notes'));
    }

    /**
     * AC-12: WHEN a room receives >10 run requests/min THEN the 11th returns HTTP 429.
     */
    public function test_ac12_rate_limit_10_per_min(): void
    {
        Http::fake([
            '*' => Http::response(['status' => ['id' => 3, 'description' => 'OK'], 'stdout' => 'ok'], 200),
        ]);

        $user = User::factory()->create();
        $room = Room::create(['user_id' => $user->id, 'slug' => 'limit-ac12', 'status' => 'active']);
        RateLimiter::clear('room-run:' . $room->slug);

        for ($i = 0; $i < 10; $i++) {
            $res = $this->postJson("/api/rooms/{$room->slug}/run", ['code' => 'true']);
            $this->assertEquals(200, $res->status());
        }

        $eleventh = $this->postJson("/api/rooms/{$room->slug}/run", ['code' => 'true']);
        $this->assertEquals(429, $eleventh->status());
    }
}
