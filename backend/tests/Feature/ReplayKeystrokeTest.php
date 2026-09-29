<?php

namespace Tests\Feature;

use App\Models\Keystroke;
use App\Models\Participant;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReplayKeystrokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_store_and_replay_ordered_keystrokes(): void
    {
        $user = User::factory()->create();
        $room = Room::create([
            'user_id' => $user->id,
            'slug' => 'replay-sample-1',
            'status' => 'active',
            'language' => 'typescript',
        ]);

        $participant = Participant::create([
            'room_id' => $room->id,
            'name' => 'Sarah',
            'color' => '#10B981',
        ]);

        // Post batch of keystrokes
        $postRes = $this->postJson("/api/rooms/{$room->slug}/keystrokes", [
            'participant_id' => $participant->id,
            'keystrokes' => [
                ['delta' => ['insert' => 'world'], 'ts_ms' => 2500],
                ['delta' => ['insert' => 'hello '], 'ts_ms' => 1200],
            ],
        ]);
        $postRes->assertStatus(201)
            ->assertJsonPath('count', 2);

        // Fetch replay
        $replayRes = $this->getJson("/api/rooms/{$room->slug}/replay");
        $replayRes->assertStatus(200)
            ->assertJsonPath('total', 2);

        $items = $replayRes->json('data');
        $this->assertEquals(1200, $items[0]['ts_ms']);
        $this->assertEquals(2500, $items[1]['ts_ms']);
        $this->assertEquals('Sarah', $items[0]['participant']['name']);
    }
}
