<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Scorecard extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'room_id',
        'problem_solving',
        'code_quality',
        'communication',
        'speed',
        'notes',
        'share_token',
    ];

    protected $casts = [
        'problem_solving' => 'integer',
        'code_quality' => 'integer',
        'communication' => 'integer',
        'speed' => 'integer',
    ];

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
