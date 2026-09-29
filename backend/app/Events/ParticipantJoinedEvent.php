<?php

namespace App\Events;

use App\Models\Participant;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParticipantJoinedEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $slug, public Participant $participant)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('room.' . $this->slug),
        ];
    }

    public function broadcastAs(): string
    {
        return 'participant.joined';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->participant->id,
            'name' => $this->participant->name,
            'color' => $this->participant->color,
            'is_interviewer' => $this->participant->is_interviewer,
        ];
    }
}
