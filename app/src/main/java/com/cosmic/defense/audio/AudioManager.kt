package com.cosmic.defense.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.cosmic.defense.data.DataManager

class AudioManager(private val context: Context, private val dataManager: DataManager) {

    private val soundPool: SoundPool?
    private val vibrator: Vibrator?

    init {
        soundPool = try {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            SoundPool.Builder()
                .setMaxStreams(8)
                .setAudioAttributes(audioAttributes)
                .build()
        } catch (e: Throwable) {
            null
        }

        vibrator = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }
        } catch (e: Throwable) {
            null
        }
    }

    fun playShoot() {}
    fun playHit() {}
    fun playExplode() { vibrate(40) }
    fun playLaser() { vibrate(30) }
    fun playChestOpen() { vibrate(60) }

    fun vibrate(durationMs: Long) {
        try {
            if (!dataManager.isVibrateEnabled() || vibrator == null || !vibrator.hasVibrator()) return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(durationMs)
            }
        } catch (e: Throwable) {
            // 忽略特定機型震動權限或硬體異常
        }
    }

    fun release() {
        try {
            soundPool?.release()
        } catch (e: Throwable) {
            // 忽略釋放異常
        }
    }
}
