package com.cosmic.defense.engine

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.cosmic.defense.audio.AudioManager
import com.cosmic.defense.config.GameConfig
import com.cosmic.defense.data.DataManager
import com.cosmic.defense.skills.SkillManager
import com.cosmic.defense.world.World
import kotlin.random.Random

class GameView(
    context: Context,
    val dataManager: DataManager,
    val audioManager: AudioManager,
    val skillManager: SkillManager
) : SurfaceView(context), SurfaceHolder.Callback {

    val world = World(dataManager, audioManager, skillManager)
    var gameLoop: GameLoop? = null

    private var scaleXFactor = 1f
    private var scaleYFactor = 1f
    private var offsetX = 0f
    private var offsetY = 0f

    private val starCount = 120
    private val starX = FloatArray(starCount) { Random.nextFloat() * GameConfig.LOGICAL_WIDTH }
    private val starY = FloatArray(starCount) { Random.nextFloat() * GameConfig.LOGICAL_HEIGHT }
    private val starSpeed = FloatArray(starCount) { Random.nextFloat() * 40f + 15f }
    private val starRadius = FloatArray(starCount) { Random.nextFloat() * 2.5f + 0.8f }
    private val starPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.WHITE }

    private val hudBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(49, 49, 66) // #313142 參考圖 155552 灰紫金屬底色
    }
    private val hudTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 36f
        isFakeBoldText = true
    }
    private val outlineTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.BLACK
        textSize = 36f
        isFakeBoldText = true
        style = Paint.Style.STROKE
        strokeWidth = 8f
        strokeJoin = Paint.Join.ROUND
    }
    private val subTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(203, 213, 225)
        textSize = 24f
        isFakeBoldText = true
    }
    private val buttonPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val tempRect = RectF()

    var animTime: Float = 0f

    var onPauseClicked: (() -> Unit)? = null
    var onSpeedUnlockNeeded: ((speed: Int, cost: Int) -> Unit)? = null

    init {
        holder.addCallback(this)
        isFocusable = true
        keepScreenOn = true
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        gameLoop = GameLoop(holder, this).apply {
            isRunning = true
            start()
        }
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        val aspectScreen = width.toFloat() / height.toFloat()
        val aspectVirtual = GameConfig.LOGICAL_WIDTH / GameConfig.LOGICAL_HEIGHT

        if (aspectScreen > aspectVirtual) {
            scaleYFactor = height.toFloat() / GameConfig.LOGICAL_HEIGHT
            scaleXFactor = scaleYFactor
            offsetX = (width - GameConfig.LOGICAL_WIDTH * scaleXFactor) / 2f
            offsetY = 0f
        } else {
            scaleXFactor = width.toFloat() / GameConfig.LOGICAL_WIDTH
            scaleYFactor = scaleXFactor
            offsetX = 0f
            offsetY = (height - GameConfig.LOGICAL_HEIGHT * scaleYFactor) / 2f
        }
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        var retry = true
        gameLoop?.isRunning = false
        while (retry) {
            try {
                gameLoop?.join()
                retry = false
            } catch (e: InterruptedException) {
            }
        }
    }

    fun fixedUpdate(dt: Float) {
        animTime += dt

        for (i in 0 until starCount) {
            starY[i] += starSpeed[i] * dt
            if (starY[i] > GameConfig.LOGICAL_HEIGHT) {
                starY[i] = 0f
                starX[i] = Random.nextFloat() * GameConfig.LOGICAL_WIDTH
            }
        }

        world.update(dt)
    }

    fun render(canvas: Canvas) {
        canvas.drawColor(Color.BLACK)

        canvas.save()
        canvas.translate(offsetX, offsetY)
        canvas.scale(scaleXFactor, scaleYFactor)

        // 155552 紫藍星雲深空底色
        canvas.drawColor(Color.rgb(30, 25, 54))
        for (i in 0 until starCount) {
            val alpha = (130 + Math.sin((animTime * 3f + i).toDouble()).toFloat() * 90).toInt().coerceIn(45, 245)
            starPaint.alpha = alpha
            canvas.drawCircle(starX[i], starY[i], starRadius[i], starPaint)
        }

        world.draw(canvas, animTime)
        drawTopHud(canvas)
        drawBottomBar(canvas)

        canvas.restore()
    }

    private fun drawTopHud(canvas: Canvas) {
        // 頂部金屬板 (#313142)
        tempRect.set(0f, 0f, GameConfig.LOGICAL_WIDTH, 215f)
        canvas.drawRect(tempRect, hudBgPaint)

        // 左側：金幣深色凹槽 + 戰機金幣徽章
        buttonPaint.color = Color.rgb(26, 27, 36)
        tempRect.set(88f, 62f, 335f, 134f)
        canvas.drawRect(tempRect, buttonPaint)

        buttonPaint.color = Color.rgb(250, 204, 21)
        canvas.drawCircle(86f, 98f, 38f, buttonPaint)
        buttonPaint.color = Color.rgb(217, 119, 6)
        canvas.drawCircle(86f, 98f, 28f, buttonPaint)

        hudTextPaint.textAlign = Paint.Align.CENTER
        hudTextPaint.textSize = 40f
        hudTextPaint.color = Color.WHITE
        canvas.drawText("${dataManager.getCoins()}", 216f, 112f, hudTextPaint)

        // 中央：得分標籤 + 大字分數 (厚黑描邊)
        subTextPaint.textAlign = Paint.Align.CENTER
        subTextPaint.color = Color.rgb(18, 19, 28)
        subTextPaint.textSize = 26f
        canvas.drawText("得分", 510f, 58f, subTextPaint)

        val scoreStr = String.format("%,d", world.currentScore)
        outlineTextPaint.textAlign = Paint.Align.CENTER
        outlineTextPaint.textSize = 58f
        hudTextPaint.textSize = 58f
        canvas.drawText(scoreStr, 510f, 122f, outlineTextPaint)
        canvas.drawText(scoreStr, 510f, 122f, hudTextPaint)

        // 右側：皇冠最佳成績凹槽 + 圓形金屬暫停鈕
        subTextPaint.color = Color.rgb(250, 204, 21)
        canvas.drawText("👑 最佳", 805f, 54f, subTextPaint)

        buttonPaint.color = Color.rgb(26, 27, 36)
        tempRect.set(705f, 64f, 905f, 134f)
        canvas.drawRect(tempRect, buttonPaint)

        val bestStr = String.format("%,d", dataManager.getBestScore())
        hudTextPaint.textSize = 38f
        canvas.drawText(bestStr, 805f, 112f, hudTextPaint)

        // 圓形金屬暫停鈕 (||)
        buttonPaint.color = Color.rgb(124, 134, 166)
        canvas.drawCircle(995f, 98f, 44f, buttonPaint)
        buttonPaint.color = Color.rgb(163, 173, 204)
        canvas.drawCircle(995f, 98f, 36f, buttonPaint)
        buttonPaint.color = Color.WHITE
        canvas.drawRect(981f, 80f, 991f, 116f, buttonPaint)
        canvas.drawRect(999f, 80f, 1009f, 116f, buttonPaint)

        // 下方緊湊數值列：球傷害、技能傷害、FPS
        val ballDmg = world.skillManager.getEffectiveBallDamage().toInt()
        val ballBonusPct = (world.skillManager.ballDamageBonusRatio * 100).toInt()
        val skillDmg = world.skillManager.getEffectiveLaserDamage().toInt()
        val skillBonusPct = (world.skillManager.skillDamageBonusRatio * 100).toInt()

        subTextPaint.textAlign = Paint.Align.LEFT
        subTextPaint.textSize = 23f
        subTextPaint.color = Color.rgb(254, 240, 138)
        canvas.drawText("球 $ballDmg (+$ballBonusPct%)", 45f, 188f, subTextPaint)

        subTextPaint.color = Color.rgb(125, 211, 252)
        canvas.drawText("技能 $skillDmg (+$skillBonusPct%)", 380f, 188f, subTextPaint)

        if (dataManager.isShowFps()) {
            subTextPaint.color = Color.rgb(134, 239, 172)
            canvas.drawText("FPS ${gameLoop?.currentFps ?: 60}", 865f, 188f, subTextPaint)
        }
    }

    private fun drawBottomBar(canvas: Canvas) {
        val barY = 2110f
        tempRect.set(0f, barY, GameConfig.LOGICAL_WIDTH, GameConfig.LOGICAL_HEIGHT)
        canvas.drawRect(tempRect, hudBgPaint)

        // 左側：立體圓形倍速按鈕 (>> x1 / x2 / x5)
        val currentSpeed = (gameLoop?.gameSpeedMultiplier ?: 1f).toInt()
        buttonPaint.color = Color.rgb(82, 92, 112)
        canvas.drawCircle(112f, barY + 110f, 68f, buttonPaint)
        buttonPaint.color = Color.rgb(128, 140, 164)
        canvas.drawCircle(112f, barY + 102f, 52f, buttonPaint)

        hudTextPaint.textAlign = Paint.Align.CENTER
        hudTextPaint.textSize = 30f
        hudTextPaint.color = Color.WHITE
        canvas.drawText(">> x$currentSpeed", 112f, barY + 112f, hudTextPaint)

        // 右側凹槽框架與 3 格銀邊道具卡
        buttonPaint.color = Color.rgb(28, 30, 42)
        tempRect.set(250f, barY + 16f, 830f, barY + 210f)
        canvas.drawRect(tempRect, buttonPaint)

        drawItemCard(canvas, 276f, barY + 30f, "❄️", world.freezeRemainingUses, world.freezeTimer > 0f)
        drawItemCard(canvas, 466f, barY + 30f, "🧨", world.bombRemainingUses, active = false)
        drawItemCard(canvas, 656f, barY + 30f, "x2", world.doubleDamageRemainingUses, world.doubleDamageTimer > 0f)
    }

    private fun drawItemCard(canvas: Canvas, x: Float, y: Float, iconText: String, uses: Int, active: Boolean) {
        tempRect.set(x, y, x + 150f, y + 160f)
        buttonPaint.color = if (active) Color.rgb(245, 158, 11) else Color.rgb(108, 118, 137)
        canvas.drawRoundRect(tempRect, 8f, 8f, buttonPaint)

        hudTextPaint.textAlign = Paint.Align.CENTER
        hudTextPaint.textSize = 48f
        hudTextPaint.color = if (iconText == "x2") Color.rgb(254, 240, 138) else Color.WHITE
        canvas.drawText(iconText, x + 75f, y + 88f, hudTextPaint)

        val countStr = "x$uses"
        outlineTextPaint.textAlign = Paint.Align.CENTER
        outlineTextPaint.textSize = 32f
        hudTextPaint.textSize = 32f
        hudTextPaint.color = Color.WHITE
        canvas.drawText(countStr, x + 75f, y + 148f, outlineTextPaint)
        canvas.drawText(countStr, x + 75f, y + 148f, hudTextPaint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val virtX = (event.x - offsetX) / scaleXFactor
        val virtY = (event.y - offsetY) / scaleYFactor

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                if (virtX in 930f..1060f && virtY in 35f..160f) {
                    onPauseClicked?.invoke()
                    return true
                }

                if (virtY >= 2110f) {
                    if (virtX in 30f..200f) {
                        val currentSpeed = (gameLoop?.gameSpeedMultiplier ?: 1f).toInt()
                        when (currentSpeed) {
                            1 -> {
                                if (dataManager.is2xUnlocked()) gameLoop?.gameSpeedMultiplier = 2.0f
                                else onSpeedUnlockNeeded?.invoke(2, GameConfig.UNLOCK_2X_COST)
                            }
                            2 -> {
                                if (dataManager.is5xUnlocked()) gameLoop?.gameSpeedMultiplier = 5.0f
                                else gameLoop?.gameSpeedMultiplier = 1.0f
                            }
                            else -> gameLoop?.gameSpeedMultiplier = 1.0f
                        }
                        return true
                    }

                    if (virtX in 270f..435f) {
                        world.useFreezeItem()
                        return true
                    } else if (virtX in 460f..625f) {
                        world.useBombItem()
                        return true
                    } else if (virtX in 650f..815f) {
                        world.useDoubleDamageItem()
                        return true
                    }
                }

                world.isTouching = true
                world.touchX = virtX
                world.touchY = virtY
            }

            MotionEvent.ACTION_MOVE -> {
                world.touchX = virtX
                world.touchY = virtY
            }

            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                world.isTouching = false
            }
        }
        return true
    }
}
