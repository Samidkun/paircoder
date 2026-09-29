<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Services\Judge0Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class ExecutionController extends Controller
{
    public function __construct(protected Judge0Service $judge0Service)
    {
    }

    public function run(Request $request, string $slug): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:100000',
            'language' => 'nullable|string|max:30',
            'stdin' => 'nullable|string|max:10000',
        ]);

        $room = Room::where('slug', $slug)->firstOrFail();

        // Rate limit: 10 runs per minute per room
        $rateLimitKey = 'room-run:' . $room->slug;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'message' => 'Too many execution requests. Limit is 10 runs per minute per room.',
                'retry_after' => $seconds,
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 60);

        $language = $validated['language'] ?? $room->language ?? 'typescript';
        $result = $this->judge0Service->execute(
            $validated['code'],
            $language,
            $validated['stdin'] ?? null
        );

        return response()->json([
            'data' => array_merge($result, [
                'language' => $language,
                'room_slug' => $room->slug,
            ]),
        ]);
    }
}
