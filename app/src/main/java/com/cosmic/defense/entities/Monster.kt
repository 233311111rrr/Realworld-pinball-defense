package com.cosmic.defense.entities

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import com.cosmic.defense.config.GameConfig

enum class MonsterKind {
    OCTOPUS,
    CYCLOPS,
    DRONE,
    CRUISER,
    CHEST,
    BOSS
}

class Monster {
    var active: Boolean = false
    var kind: MonsterKind = MonsterKind.OCTOPUS
    var x: Float = 0f
    var y: Float = 0f
    var radius: Float = GameConfig.MONSTER_WIDTH / 2f
    var currentHp: Float = 100f
    var maxHp: Float = 100f
    var rowIndex: Int = 0
    var isChest: Boolean = false
    var isBoss: Boolean = false
    var pathProgress: Float = 0f

    var isTargetLocked: Boolean = false
    var lockTimer: Float = 0f

    private val bodyPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val detailPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        textSize = 28f
        isFakeBoldText = true
        color = Color.WHITE
        setShadowLayer(4f, 0f, 2f, Color.BLACK)
    }
    private val hpBarBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.argb(180, 20, 24, 39)
    }
    private val hpBarFgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(244, 63, 94)
    }
    private val lockPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(244, 63, 94)
        style = Paint.Style.STROKE
        strokeWidth = 4f
    }

    private val tempRect = RectF()
    private val tempPath = Path()

    fun init(kind: MonsterKind, startX: Float, startY: Float, hp: Float, row: Int, isChest: Boolean, isBoss: Boolean) {
        this.active = true
        this.kind = kind
        this.x = startX
        this.y = startY
        this.radius = if (isBoss) (GameConfig.MONSTER_WIDTH * 0.9f) else (GameConfig.MONSTER_WIDTH * 0.45f)
        this.currentHp = hp
        this.maxHp = hp
        this.rowIndex = row
        this.isChest = isChest
        this.isBoss = isBoss
        this.pathProgress = 0f
        this.isTargetLocked = false
        this.lockTimer = 0f
    }

    fun takeDamage(amount: Float): Boolean {
        currentHp -= amount
        if (currentHp <= 0f) {
            currentHp = 0f
            active = false
            return true
        }
        return false
    }

    fun formatHp(hp: Float): String {
        return when {
            hp >= 1_000_000f -> String.format("%.1fM", hp / 1_000_000f)
            hp >= 1_000f -> String.format("%.1fK", hp / 1_000f)
            else -> hp.toInt().toString()
        }
    }

    fun draw(canvas: Canvas, animTime: Float) {
        if (!active) return

        when (kind) {
            MonsterKind.CHEST -> drawChest(canvas, animTime)
            MonsterKind.BOSS -> drawBoss(canvas, animTime)
            MonsterKind.OCTOPUS -> drawOctopus(canvas, animTime)
            else -> drawGargoyle(canvas, animTime)
        }

        // 浮動血量文字 (字體加粗白字帶深色陰影，緊貼怪物頭頂，與截圖完全一致)
        textPaint.color = if (isChest) Color.rgb(254, 240, 138) else Color.WHITE
        textPaint.textSize = if (isBoss) 30f else 24f
        canvas.drawText(formatHp(currentHp), x, y - radius - 8f, textPaint)

        // 鎖定狀態時繪製截圖中的圓弧括號 ( )
        if (isTargetLocked) {
            drawLockReticle(canvas, animTime)
        }
    }

    private fun drawLockReticle(canvas: Canvas, animTime: Float) {
        val lockR = radius * 1.35f
        lockPaint.color = Color.rgb(241, 245, 249)
        lockPaint.strokeWidth = 5f
        tempRect.set(x - lockR, y - lockR, x + lockR, y + lockR)
        // 左弧括號 (
        canvas.drawArc(tempRect, 125f, 110f, false, lockPaint)
        // 右弧括號 )
        canvas.drawArc(tempRect, -55f, 110f, false, lockPaint)
    }

    private fun drawGargoyle(canvas: Canvas, animTime: Float) {
        // 1. 左右折疊蝠翼
        bodyPaint.color = Color.rgb(124, 99, 70)
        tempPath.reset()
        tempPath.moveTo(x - radius * 0.4f, y)
        tempPath.lineTo(x - radius * 1.15f, y - radius * 0.5f)
        tempPath.lineTo(x - radius * 0.85f, y + radius * 0.6f)
        tempPath.close()
        canvas.drawPath(tempPath, bodyPaint)

        tempPath.reset()
        tempPath.moveTo(x + radius * 0.4f, y)
        tempPath.lineTo(x + radius * 1.15f, y - radius * 0.5f)
        tempPath.lineTo(x + radius * 0.85f, y + radius * 0.6f)
        tempPath.close()
        canvas.drawPath(tempPath, bodyPaint)

        // 2. 主體身軀 (古銅棕褐色)
        bodyPaint.color = Color.rgb(156, 126, 90)
        canvas.drawCircle(x, y, radius * 0.8f, bodyPaint)

        // 3. 腹部淺色陰影
        detailPaint.color = Color.rgb(182, 151, 114)
        canvas.drawCircle(x, y + radius * 0.2f, radius * 0.45f, detailPaint)

        // 4. 頭頂雙彎角
        detailPaint.color = Color.rgb(69, 50, 37)
        tempPath.reset()
        tempPath.moveTo(x - radius * 0.45f, y - radius * 0.35f)
        tempPath.lineTo(x - radius * 0.65f, y - radius * 1.05f)
        tempPath.lineTo(x - radius * 0.25f, y - radius * 0.65f)
        tempPath.close()
        canvas.drawPath(tempPath, detailPaint)

        tempPath.reset()
        tempPath.moveTo(x + radius * 0.45f, y - radius * 0.35f)
        tempPath.lineTo(x + radius * 0.65f, y - radius * 1.05f)
        tempPath.lineTo(x + radius * 0.25f, y - radius * 0.65f)
        tempPath.close()
        canvas.drawPath(tempPath, detailPaint)

        // 5. 大眼睛 (白眼球 + 黑色瞳孔)
        detailPaint.color = Color.WHITE
        canvas.drawCircle(x - radius * 0.26f, y - radius * 0.15f, radius * 0.22f, detailPaint)
        canvas.drawCircle(x + radius * 0.26f, y - radius * 0.15f, radius * 0.22f, detailPaint)
        detailPaint.color = Color.rgb(20, 24, 39)
        canvas.drawCircle(x - radius * 0.26f, y - radius * 0.15f, radius * 0.10f, detailPaint)
        canvas.drawCircle(x + radius * 0.26f, y - radius * 0.15f, radius * 0.10f, detailPaint)
    }

    private fun drawChest(canvas: Canvas, animTime: Float) {
        // 紫金皇家寶箱 (截圖中 37.3K / 9.41K 的外觀)
        bodyPaint.color = Color.rgb(124, 58, 237) // 紫色箱體
        tempRect.set(x - radius * 0.9f, y - radius * 0.65f, x + radius * 0.9f, y + radius * 0.65f)
        canvas.drawRoundRect(tempRect, 10f, 10f, bodyPaint)

        // 金色滾邊與中線鎖扣
        detailPaint.color = Color.rgb(251, 191, 36)
        detailPaint.strokeWidth = 4f
        detailPaint.style = Paint.Style.STROKE
        canvas.drawRoundRect(tempRect, 10f, 10f, detailPaint)

        detailPaint.style = Paint.Style.FILL
        canvas.drawRect(x - radius * 0.9f, y - 3f, x + radius * 0.9f, y + 3f, detailPaint)

        // 金色鎖頭
        detailPaint.color = Color.rgb(254, 240, 138)
        canvas.drawCircle(x, y, radius * 0.24f, detailPaint)
        detailPaint.color = Color.rgb(30, 41, 59)
        canvas.drawCircle(x, y, radius * 0.09f, detailPaint)
    }

    private fun drawBoss(canvas: Canvas, animTime: Float) {
        bodyPaint.color = Color.rgb(220, 38, 38)
        canvas.drawCircle(x, y, radius * 0.85f, bodyPaint)

        detailPaint.color = Color.rgb(245, 158, 11)
        tempPath.reset()
        tempPath.moveTo(x - radius * 0.8f, y - radius * 0.5f)
        tempPath.lineTo(x, y - radius * 1.35f)
        tempPath.lineTo(x + radius * 0.8f, y - radius * 0.5f)
        tempPath.close()
        canvas.drawPath(tempPath, detailPaint)

        detailPaint.color = Color.WHITE
        canvas.drawCircle(x - radius * 0.3f, y - radius * 0.1f, radius * 0.25f, detailPaint)
        canvas.drawCircle(x + radius * 0.3f, y - radius * 0.1f, radius * 0.25f, detailPaint)
        detailPaint.color = Color.rgb(15, 23, 42)
        canvas.drawCircle(x - radius * 0.3f, y - radius * 0.1f, radius * 0.12f, detailPaint)
        canvas.drawCircle(x + radius * 0.3f, y - radius * 0.1f, radius * 0.12f, detailPaint)
    }

    private fun drawOctopus(canvas: Canvas, animTime: Float) {
        // 粉紅外星小章魚 (截圖右下角 10.1K / 5.18K)
        bodyPaint.color = Color.rgb(232, 121, 249)
        canvas.drawCircle(x, y - radius * 0.2f, radius * 0.75f, bodyPaint)

        // 觸手
        detailPaint.color = Color.rgb(192, 38, 211)
        detailPaint.strokeWidth = 5f
        detailPaint.style = Paint.Style.STROKE
        for (i in -2..2) {
            val tx = x + (i * radius * 0.3f)
            val sway = Math.sin((animTime * 6f + i).toDouble()).toFloat() * 6f
            canvas.drawLine(x + (i * radius * 0.18f), y + radius * 0.3f, tx, y + radius * 0.8f + sway, detailPaint)
        }
        detailPaint.style = Paint.Style.FILL

        // 眼睛
        detailPaint.color = Color.WHITE
        canvas.drawCircle(x - radius * 0.26f, y - radius * 0.2f, radius * 0.2f, detailPaint)
        canvas.drawCircle(x + radius * 0.26f, y - radius * 0.2f, radius * 0.2f, detailPaint)
        detailPaint.color = Color.rgb(15, 23, 42)
        canvas.drawCircle(x - radius * 0.26f, y - radius * 0.2f, radius * 0.09f, detailPaint)
        canvas.drawCircle(x + radius * 0.26f, y - radius * 0.2f, radius * 0.09f, detailPaint)
    }
}
