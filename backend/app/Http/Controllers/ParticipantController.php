<?php

namespace App\Http\Controllers;

use App\Events\ParticipantJoinedEvent;
use App\Models\Participant;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ParticipantController extends Controller
{
    public function join(Request $request, string $slug): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:100',
        ]);

        $room = Room::where('slug', $slug)->firstOrFail();

        if ($room->status === 'ended') {
            return response()->json(['message' => 'Room has already ended'], 400);
        }

        if ($room->status === 'waiting') {
            $room->update([
                'status' => 'active',
                'started_at' => now(),
            ]);
        }

        $participant = Participant::create([
            'room_id' => $room->id,
            'name' => trim($validated['name']),
            'is_interviewer' => false,
            'color' => '#10B981', // candidate amber/emerald indicator
        ]);

        broadcast(new ParticipantJoinedEvent($room->slug, $participant))->toOthers();

        $token = 'cand_' . Str::random(32);

        return response()->json([
            'data' => [
                'participant_id' => $participant->id,
                'name' => $participant->name,
                'color' => $participant->color,
                'is_interviewer' => false,
                'token' => $token,
                'room' => [
                    'slug' => $room->slug,
                    'language' => $room->language,
                    'status' => $room->status,
                ],
            ],
        ], 200);
    }
}
