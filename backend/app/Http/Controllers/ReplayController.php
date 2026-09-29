<?php

namespace App\Http\Controllers;

use App\Models\Keystroke;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReplayController extends Controller
{
    public function store(Request $request, string $slug): JsonResponse
    {
        $validated = $request->validate([
            'participant_id' => 'required|uuid|exists:participants,id',
            'keystrokes' => 'nullable|array',
            'delta' => 'nullable|array',
            'ts_ms' => 'nullable|integer',
        ]);

        $room = Room::where('slug', $slug)->firstOrFail();

        // Support batch or single delta
        if (!empty($validated['keystrokes'])) {
            $records = [];
            $now = now();
            foreach ($validated['keystrokes'] as $item) {
                $records[] = [
                    'room_id' => $room->id,
                    'participant_id' => $validated['participant_id'],
                    'delta' => json_encode($item['delta'] ?? []),
                    'ts_ms' => $item['ts_ms'] ?? 0,
                    'created_at' => $now,
                ];
            }
            Keystroke::insert($records);
            $count = count($records);
        } else {
            Keystroke::create([
                'room_id' => $room->id,
                'participant_id' => $validated['participant_id'],
                'delta' => $validated['delta'] ?? [],
                'ts_ms' => $validated['ts_ms'] ?? 0,
                'created_at' => now(),
            ]);
            $count = 1;
        }

        return response()->json([
            'message' => "Recorded {$count} keystroke(s)",
            'count' => $count,
        ], 201);
    }

    public function index(string $slug): JsonResponse
    {
        $room = Room::where('slug', $slug)->firstOrFail();

        $keystrokes = Keystroke::where('room_id', $room->id)
            ->with('participant:id,name,color,is_interviewer')
            ->orderBy('ts_ms', 'asc')
            ->get(['id', 'room_id', 'participant_id', 'delta', 'ts_ms', 'created_at']);

        return response()->json([
            'data' => $keystrokes,
            'total' => $keystrokes->count(),
            'room' => [
                'slug' => $room->slug,
                'language' => $room->language,
                'started_at' => $room->started_at,
                'ended_at' => $room->ended_at,
            ],
        ]);
    }
}
