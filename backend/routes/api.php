<?php

use App\Http\Controllers\ExecutionController;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\ReplayController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\ScorecardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Current user profile
Route::get('/user', function (Request $request) {
    return response()->json(['data' => $request->user()]);
})->middleware('auth:sanctum');

// Authenticated Interviewer Room Management
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::post('/rooms/{slug}/end', [RoomController::class, 'end']);
    Route::post('/rooms/{slug}/scorecard', [ScorecardController::class, 'store']);
    Route::get('/rooms/{slug}/scorecard', [ScorecardController::class, 'show']);
});

// Room Collaboration & Execution
Route::get('/rooms/{slug}', [RoomController::class, 'show']);
Route::post('/rooms/{slug}/join', [ParticipantController::class, 'join']);
Route::post('/rooms/{slug}/run', [ExecutionController::class, 'run']);

// Keystroke Stream & Replay
Route::post('/rooms/{slug}/keystrokes', [ReplayController::class, 'store']);
Route::get('/rooms/{slug}/replay', [ReplayController::class, 'index']);

// Public Unauthenticated Scorecard View (Hiring Manager)
Route::get('/scorecards/{share_token}', [ScorecardController::class, 'showPublic']);
