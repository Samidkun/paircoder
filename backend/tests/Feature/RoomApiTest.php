<?php

namespace Tests\Feature;

use App\Events\ParticipantJoinedEvent;
use App\Events\RoomEndedEvent;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoomApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_interviewer_can_create_room_with_12_char_slug(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/rooms', ['language' => 'typescript']);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'slug', 'language', 'status', 'participants']]);

        $slug = $response->json('data.slug');
        $rawChars = str_replace('-', '', $slug);
        $this->assertEquals(12, strlen($rawChars));
        $this->assertEquals('waiting', $response->json('data.status'));
        $this->assertCount(1, $response->json('data.participants'));
    }

    public function test_interviewer_can_list_their_rooms(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Room::create(['user_id' => $user->id, 'slug' => 'room-user-1111', 'language' => 'typescript']);
        Room::create(['user_id' => $user->id, 'slug' => 'room-user-2222', 'language' => 'python']);
        Room::create(['user_id' => $otherUser->id, 'slug' => 'room-other-333', 'language' => 'go']);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/rooms');
        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    public function test_candidate_can_join_room(): void
    {
        Event::fake([ParticipantJoinedEvent::class]);

        $user = User::factory()->create();
        $room = Room::create([
            'user_id' => $user->id,
            'slug' => 'a8f9-c2e1-4b7d',
            'status' => 'waiting',
            'language' => 'typescript',
        ]);

        $response = $this->postJson("/api/rooms/{$room->slug}/join", [
            'name' => 'Sarah Jenkins',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['participant_id', 'name', 'color', 'is_interviewer', 'token', 'room'],
            ]);

        $this->assertEquals('Sarah Jenkins', $response->json('data.name'));
        $this->assertEquals('active', $room->fresh()->status);
        Event::assertDispatched(ParticipantJoinedEvent::class);
    }

    public function test_interviewer_can_end_room(): void
    {
        Event::fake([RoomEndedEvent::class]);

        $user = User::factory()->create();
        $room = Room::create([
            'user_id' => $user->id,
            'slug' => 'end-room-1111',
            'status' => 'active',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/rooms/{$room->slug}/end");
        $response->assertStatus(200);
        $this->assertEquals('ended', $room->fresh()->status);
        $this->assertNotNull($room->fresh()->ended_at);
        Event::assertDispatched(RoomEndedEvent::class);
    }
}
