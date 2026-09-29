<?php

namespace App\Http\Controllers;

use App\Events\RoomEndedEvent;
use App\Models\Participant;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rooms = Room::where('user_id', $request->user()->id)
            ->with(['participants', 'scorecard'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $rooms]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'nullable|string|max:20',
        ]);

        $raw = strtolower(Str::random(12));
        $formattedSlug = substr($raw, 0, 4) . '-' . substr($raw, 4, 4) . '-' . substr($raw, 8, 4);

        $room = Room::create([
            'user_id' => $request->user()->id,
            'slug' => $formattedSlug,
            'language' => $validated['language'] ?? 'typescript',
            'status' => 'waiting',
        ]);

        // Auto-register interviewer as primary participant
        Participant::create([
            'room_id' => $room->id,
            'name' => $request->user()->name ?? 'Interviewer',
            'is_interviewer' => true,
            'color' => '#0071E3',
        ]);

        return response()->json(['data' => $room->load('participants')], 201);
    }

    public function show(string $slug): JsonResponse
    {
        $room = Room::where('slug', $slug)
            ->with(['participants', 'scorecard'])
            ->firstOrFail();

        return response()->json(['data' => $room]);
    }

    public function end(string $slug): JsonResponse
    {
        $room = Room::where('slug', $slug)->firstOrFail();
        $room->update([
            'status' => 'ended',
            'ended_at' => now(),
        ]);

        broadcast(new RoomEndedEvent($room->slug))->toOthers();

        return response()->json(['data' => $room]);
    }
}
