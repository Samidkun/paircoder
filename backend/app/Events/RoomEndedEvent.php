<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoomEndedEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $slug)
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
        return 'room.ended';
    }
}
