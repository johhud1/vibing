package com.vibing.vibing

import android.media.AudioManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelName = "com.vibing/system_volume"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "setVolume" -> {
                        val volume = call.argument<Double>("volume") ?: 0.0
                        setSystemVolume(volume)
                        result.success(null)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun setSystemVolume(volume: Double) {
        val audioManager = getSystemService(AUDIO_SERVICE) as AudioManager
        val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val clamped = volume.coerceIn(0.0, 1.0)
        val target = (max * clamped).toInt().coerceIn(0, max)
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, target, 0)
    }
}
