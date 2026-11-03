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
    private val outlinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(24, 18, 14)
        style = Paint.Style.STROKE
        strokeWidth = 5f
        strokeJoin = Paint.Join.ROUND
        strokeCap = Paint.Cap.ROUND
    }
    private val textOutlinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        textSize = 26f
        isFakeBoldText = true
        color = Color.BLACK
        style = Paint.Style.STROKE
        strokeWidth = 7f
        strokeJoin = Paint.Join.ROUND
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        textSize = 26f
        isFakeBoldText = true
        color = Color.WHITE
    }
    private val lockPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.rgb(248, 250, 252)
        style = Paint.Style.STROKE
        strokeWidth = 5.5f
        strokeCap = Paint.Cap.ROUND
    }

    private val tempRect = RectF()
    private val tempPath = Path()

    fun init(kind: MonsterKind, startX: Float, startY: Float, hp: Float, row: Int, isChest: Boolean, isBoss: Boolean) {
        this.active = true
        this.kind = kind
        this.x = startX
        this.y = startY
        this.radius = if (isBoss) (GameConfig.MONSTER_WIDTH * 0.88f) else (GameConfig.MONSTER_WIDTH * 0.48f)
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
            hp >= 10_000f -> String.format("%.1fK", hp / 1_000f)
            hp >= 1_000f -> String.format("%.2fK", hp / 1_000f)
            else -> hp.toInt().toString()
        }
    }

    fun draw(canvas: Canvas, animTime: Float) {
        if (!active) return

        // 鎖定狀態時先繪製截圖中的外圈圓弧括號 ( )
        if (isTargetLocked) {
            drawLockReticle(canvas)
        }

        when (kind) {
            MonsterKind.CHEST -> drawChest(canvas)
            MonsterKind.BOSS -> drawBoss(canvas)
            MonsterKind.OCTOPUS -> drawOctopus(canvas)
            else -> drawGargoyle(canvas)
        }

        // 浮動血量文字 (緊貼怪物額頭上方、厚黑描邊白字/黃字，1:1 對齊參考圖 155552)
        val hpStr = formatHp(currentHp)
        val hpY = y - radius * 0.32f
        val fontSize = if (isBoss) 30f else 25f
        textOutlinePaint.textSize = fontSize
        textPaint.textSize = fontSize
        textPaint.color = if (isChest) Color.rgb(255, 232, 56) else Color.WHITE
        canvas.drawText(hpStr, x, hpY, textOutlinePaint)
        canvas.drawText(hpStr, x, hpY, textPaint)
    }

    private fun drawLockReticle(canvas: Canvas) {
        val lockR = radius * 1.42f
        tempRect.set(x - lockR, y - lockR, x + lockR, y + lockR)
        canvas.drawArc(tempRect, 130f, 100f, false, lockPaint)
        canvas.drawArc(tempRect, -50f, 100f, false, lockPaint)
    }

    private fun drawGargoyle(canvas: Canvas) {
        // 1. 左右小蝠翼
        bodyPaint.color = Color.rgb(110, 93, 67)
        tempPath.reset()
        tempPath.moveTo(x - radius * 0.45f, y - radius * 0.1f)
        tempPath.lineTo(x - radius * 1.15f, y - radius * 0.35f)
        tempPath.lineTo(x - radius * 0.9f, y + radius * 0.35f)
        tempPath.close()
        canvas.drawPath(tempPath, bodyPaint)
        canvas.drawPath(tempPath, outlinePaint)

        tempPath.reset()
        tempPath.moveTo(x + radius * 0.45f, y - radius * 0.1f)
        tempPath.lineTo(x + radius * 1.15f, y - radius * 0.35f)
        tempPath.lineTo(x + radius * 0.9f, y + radius * 0.35f)
        tempPath.close()
        canvas.drawPath(tempPath, bodyPaint)
        canvas.drawPath(tempPath, outlinePaint)

        // 2. 下半部節肢蟲腹與捲尾
        bodyPaint.color = Color.rgb(169, 146, 108)
        tempRect.set(x - radius * 0.55f, y + radius * 0.05f, x + radius * 0.55f, y + radius * 0.95f)
        canvas.drawOval(tempRect, bodyPaint)
        canvas.drawOval(tempRect, outlinePaint)

        // 3. 頭部主體 (古銅橄欖色帶厚黑邊)
        bodyPaint.color = Color.rgb(158, 136, 99)
        canvas.drawCircle(x, y - radius * 0.18f, radius * 0.68f, bodyPaint)
        canvas.drawCircle(x, y - radius * 0.18f, radius * 0.68f, outlinePaint)

        // 4. 頭頂雙彎角
        detailPaint.color = Color.rgb(117, 97, 69)
        tempPath.reset()
        tempPath.moveTo(x - radius * 0.35f, y - radius * 0.6f)
        tempPath.lineTo(x - radius * 0.75f, y - radius * 1.05f)
        tempPath.lineTo(x - radius * 0.6f, y - radius * 0.4f)
        tempPath.close()
        canvas.drawPath(tempPath, detailPaint)
        canvas.drawPath(tempPath, outlinePaint)

        tempPath.reset()
        tempPath.moveTo(x + radius * 0.35f, y - radius * 0.6f)
        tempPath.lineTo(x + radius * 0.75f, y - radius * 1.05f)
        tempPath.lineTo(x + radius * 0.6f, y - radius * 0.4f)
        tempPath.close()
        canvas.drawPath(tempPath, detailPaint)
        canvas.drawPath(tempPath, outlinePaint)

        // 5. 發光黃眼
        detailPaint.color = Color.rgb(255, 243, 128)
        canvas.drawCircle(x - radius * 0.24f, y - radius * 0.12f, radius * 0.15f, detailPaint)
        canvas.drawCircle(x + radius * 0.24f, y - radius * 0.12f, radius * 0.15f, detailPaint)
    }

    private fun drawChest(canvas: Canvas) {
        // 紫金皇家寶箱 (155552 中 37.3K / 9.41K 的外觀)
        bodyPaint.color = Color.rgb(147, 51, 234)
        tempRect.set(x - radius * 0.92f, y - radius * 0.68f, x + radius * 0.92f, y + radius * 0.68f)
        canvas.drawRoundRect(tempRect, 12f, 12f, bodyPaint)

        // 金色厚邊框與鎖扣
        detailPaint.color = Color.rgb(250, 204, 21)
        detailPaint.strokeWidth = 6f
        detailPaint.style = Paint.Style.STROKE
        canvas.drawRoundRect(tempRect, 12f, 12f, detailPaint)
        canvas.drawRoundRect(tempRect, 12f, 12f, outlinePaint)

        detailPaint.style = Paint.Style.FILL
        canvas.drawRect(x - radius * 0.92f, y - 5f, x + radius * 0.92f, y + 5f, detailPaint)

        // 中央黃金大鎖牌
        detailPaint.color = Color.rgb(254, 240, 138)
        tempRect.set(x - radius * 0.28f, y - radius * 0.28f, x + radius * 0.28f, y + radius * 0.28f)
        canvas.drawRoundRect(tempRect, 6f, 6f, detailPaint)
        canvas.drawRoundRect(tempRect, 6f, 6f, outlinePaint)
    }

    private fun drawBoss(canvas: Canvas) {
        bodyPaint.color = Color.rgb(220, 38, 38)
        canvas.drawCircle(x, y, radius * 0.85f, bodyPaint)
        canvas.drawCircle(x, y, radius * 0.85f, outlinePaint)

        detailPaint.color = Color.rgb(245, 158, 11)
        tempPath.reset()
        tempPath.moveTo(x - radius * 0.8f, y - radius * 0.5f)
        tempPath.lineTo(x, y - radius * 1.35f)
        tempPath.lineTo(x + radius * 0.8f, y - radius * 0.5f)
        tempPath.close()
        canvas.drawPath(tempPath, detailPaint)
        canvas.drawPath(tempPath, outlinePaint)

        detailPaint.color = Color.rgb(254, 240, 138)
        canvas.drawCircle(x - radius * 0.3f, y - radius * 0.1f, radius * 0.22f, detailPaint)
        canvas.drawCircle(x + radius * 0.3f, y - radius * 0.1f, radius * 0.22f, detailPaint)
    }

    private fun drawOctopus(canvas: Canvas) {
        // 粉紅紫殼外星小章魚 (155552 右下角 10.1K / 5.18K)
        bodyPaint.color = Color.rgb(255, 139, 214)
        canvas.drawCircle(x, y + radius * 0.05f, radius * 0.72f, bodyPaint)
        canvas.drawCircle(x, y + radius * 0.05f, radius * 0.72f, outlinePaint)

        // 紫色斑點頭罩
        detailPaint.color = Color.rgb(157, 78, 221)
        tempRect.set(x - radius * 0.76f, y - radius * 0.72f, x + radius * 0.76f, y + radius * 0.25f)
        canvas.drawArc(tempRect, 180f, 180f, true, detailPaint)
        canvas.drawArc(tempRect, 180f, 180f, true, outlinePaint)

        // 水汪汪大黑眼 + 白高光
        detailPaint.color = Color.rgb(30, 16, 40)
        canvas.drawCircle(x - radius * 0.26f, y + radius * 0.08f, radius * 0.16f, detailPaint)
        canvas.drawCircle(x + radius * 0.26f, y + radius * 0.08f, radius * 0.16f, detailPaint)
        detailPaint.color = Color.WHITE
        canvas.drawCircle(x - radius * 0.30f, y + radius * 0.03f, radius * 0.06f, detailPaint)
        canvas.drawCircle(x + radius * 0.22f, y + radius * 0.03f, radius * 0.06f, detailPaint)
    }
}
