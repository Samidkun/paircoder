<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Scorecard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ScorecardController extends Controller
{
    public function store(Request $request, string $slug): JsonResponse
    {
        $validated = $request->validate([
            'problem_solving' => 'required|integer|min:1|max:5',
            'code_quality' => 'required|integer|min:1|max:5',
            'communication' => 'required|integer|min:1|max:5',
            'speed' => 'required|integer|min:1|max:5',
            'notes' => 'nullable|string|max:10000',
        ]);

        $room = Room::where('slug', $slug)->firstOrFail();

        $token = 'tok_' . Str::random(28); // 32 chars total

        $scorecard = Scorecard::updateOrCreate(
            ['room_id' => $room->id],
            [
                'problem_solving' => $validated['problem_solving'],
                'code_quality' => $validated['code_quality'],
                'communication' => $validated['communication'],
                'speed' => $validated['speed'],
                'notes' => $validated['notes'] ?? null,
                'share_token' => $token,
            ]
        );

        return response()->json([
            'data' => $scorecard->load('room'),
            'share_url' => url("/scorecards/{$scorecard->share_token}"),
        ], 201);
    }

    public function show(string $slug): JsonResponse
    {
        $room = Room::where('slug', $slug)->firstOrFail();
        $scorecard = Scorecard::where('room_id', $room->id)
            ->with(['room.participants', 'room.user:id,name'])
            ->firstOrFail();

        return response()->json([
            'data' => $scorecard,
            'share_url' => url("/scorecards/{$scorecard->share_token}"),
        ]);
    }

    public function showPublic(string $share_token): JsonResponse
    {
        $scorecard = Scorecard::where('share_token', $share_token)
            ->with([
                'room' => function ($q) {
                    $q->with(['participants', 'user:id,name']);
                }
            ])
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $scorecard->id,
                'problem_solving' => $scorecard->problem_solving,
                'code_quality' => $scorecard->code_quality,
                'communication' => $scorecard->communication,
                'speed' => $scorecard->speed,
                'average' => round(($scorecard->problem_solving + $scorecard->code_quality + $scorecard->communication + $scorecard->speed) / 4, 1),
                'notes' => $scorecard->notes,
                'share_token' => $scorecard->share_token,
                'created_at' => $scorecard->created_at,
                'room' => [
                    'slug' => $scorecard->room->slug,
                    'language' => $scorecard->room->language,
                    'started_at' => $scorecard->room->started_at,
                    'ended_at' => $scorecard->room->ended_at,
                    'interviewer' => $scorecard->room->user->name ?? 'Interviewer',
                    'participants' => $scorecard->room->participants,
                ],
            ],
        ]);
    }
}
