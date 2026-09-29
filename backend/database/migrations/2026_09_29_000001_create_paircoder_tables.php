<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('slug', 14)->unique(); // e.g. a8f9-c2e1-4b7d or 12 raw chars
            $table->string('language', 20)->default('typescript');
            $table->enum('status', ['waiting', 'active', 'ended'])->default('waiting');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });

        Schema::create('participants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_interviewer')->default(false);
            $table->string('color', 7)->default('#0071E3');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('left_at')->nullable();
        });

        Schema::create('keystrokes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignUuid('participant_id')->constrained('participants')->cascadeOnDelete();
            $table->jsonb('delta');
            $table->bigInteger('ts_ms');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['room_id', 'ts_ms']);
        });

        Schema::create('scorecards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->unsignedTinyInteger('problem_solving')->default(3);
            $table->unsignedTinyInteger('code_quality')->default(3);
            $table->unsignedTinyInteger('communication')->default(3);
            $table->unsignedTinyInteger('speed')->default(3);
            $table->text('notes')->nullable();
            $table->string('share_token', 32)->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scorecards');
        Schema::dropIfExists('keystrokes');
        Schema::dropIfExists('participants');
        Schema::dropIfExists('rooms');
    }
};
