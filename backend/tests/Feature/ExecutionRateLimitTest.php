<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class ExecutionRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_execution_is_rate_limited_to_10_requests_per_minute_per_room(): void
    {
        $user = User::factory()->create();
        $room = Room::create([
            'user_id' => $user->id,
            'slug' => 'exec-test-room',
            'status' => 'active',
            'language' => 'typescript',
        ]);

        RateLimiter::clear('room-run:' . $room->slug);
        \Illuminate\Support\Facades\Http::fake([
            '*' => \Illuminate\Support\Facades\Http::response([
                'status' => ['id' => 3, 'description' => 'Accepted'],
                'stdout' => "Test output\n",
                'stderr' => '',
                'time' => '0.01',
                'memory' => 12000,
            ], 200),
        ]);

        // Run 10 times — all must succeed
        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson("/api/rooms/{$room->slug}/run", [
                'code' => 'console.log("iteration ' . $i . '")',
                'language' => 'typescript',
            ]);
            $this->assertEquals(200, $response->status(), "Run #{$i} failed with status " . $response->status());
            $this->assertArrayHasKey('stdout', $response->json('data'));
        }

        // 11th run must return 429 Too Many Requests
        $eleventh = $this->postJson("/api/rooms/{$room->slug}/run", [
            'code' => 'console.log("exceeded")',
            'language' => 'typescript',
        ]);

        $this->assertEquals(429, $eleventh->status());
        $this->assertStringContainsString('Too many execution requests', $eleventh->json('message'));
    }
}
