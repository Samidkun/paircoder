<?php

namespace Tests\Feature;

use App\Models\Keystroke;
use App\Models\Participant;
use App\Models\Room;
use App\Models\Scorecard;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SchemaAndModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_room_can_be_created_with_uuid_and_slug(): void
    {
        $user = User::factory()->create();
        $room = Room::create([
            'user_id' => $user->id,
            'slug' => 'a8f9-c2e1-4b7d',
            'language' => 'typescript',
            'status' => 'waiting',
        ]);

        $this->assertDatabaseHas('rooms', [
            'slug' => 'a8f9-c2e1-4b7d',
            'status' => 'waiting',
        ]);
        $this->assertTrue(Str::isUuid($room->id));
        $this->assertEquals($user->id, $room->user->id);
    }

    public function test_participant_and_keystroke_and_scorecard_lifecycle(): void
    {
        $user = User::factory()->create();
        $room = Room::create([
            'user_id' => $user->id,
            'slug' => 'b1c2-d3e4-f5a6',
            'language' => 'python',
            'status' => 'active',
        ]);

        $participant = Participant::create([
            'room_id' => $room->id,
            'name' => 'Sarah Jenkins',
            'is_interviewer' => false,
            'color' => '#10B981',
        ]);

        $keystroke = Keystroke::create([
            'room_id' => $room->id,
            'participant_id' => $participant->id,
            'delta' => ['insert' => 'def solve(): pass'],
            'ts_ms' => 1240,
        ]);

        $scorecard = Scorecard::create([
            'room_id' => $room->id,
            'problem_solving' => 5,
            'code_quality' => 4,
            'communication' => 5,
            'speed' => 4,
            'notes' => 'Great technical depth',
            'share_token' => Str::random(32),
        ]);

        $this->assertCount(1, $room->participants);
        $this->assertCount(1, $room->keystrokes);
        $this->assertNotNull($room->scorecard);
        $this->assertEquals('Sarah Jenkins', $keystroke->participant->name);
        $this->assertEquals(5, $scorecard->problem_solving);
    }
}
