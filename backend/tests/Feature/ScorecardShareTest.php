<?php

namespace Tests\Feature;

use App\Models\Participant;
use App\Models\Room;
use App\Models\Scorecard;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScorecardShareTest extends TestCase
{
    use RefreshDatabase;

    public function test_interviewer_can_save_scorecard_and_generate_share_token(): void
    {
        $user = User::factory()->create();
        $room = Room::create([
            'user_id' => $user->id,
            'slug' => 'scorecard-room-1',
            'status' => 'ended',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/rooms/{$room->slug}/scorecard", [
            'problem_solving' => 5,
            'code_quality' => 4,
            'communication' => 5,
            'speed' => 4,
            'notes' => 'Solid algorithm design and clear explanation of complexities.',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['id', 'room_id', 'problem_solving', 'share_token'],
                'share_url',
            ]);

        $shareToken = $response->json('data.share_token');
        $this->assertEquals(32, strlen($shareToken));

        // Public no-auth access
        $publicRes = $this->getJson("/api/scorecards/{$shareToken}");
        $publicRes->assertStatus(200)
            ->assertJsonPath('data.problem_solving', 5)
            ->assertJsonPath('data.average', 4.5)
            ->assertJsonPath('data.notes', 'Solid algorithm design and clear explanation of complexities.');
    }
}
