<?php

use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\RoomController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return response()->json(['data' => $request->user()]);
})->middleware('auth:sanctum');

// Room Management
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::post('/rooms/{slug}/end', [RoomController::class, 'end']);
});

Route::get('/rooms/{slug}', [RoomController::class, 'show']);
Route::post('/rooms/{slug}/join', [ParticipantController::class, 'join']);
Route::post('/rooms/{slug}/run', [\App\Http\Controllers\ExecutionController::class, 'run']);
