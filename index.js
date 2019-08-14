import heatmap from './heatmap/core'

export function drawImageScaled({ img, layers = [], layer, canvas, options = {} }) {
    const ctx = canvas.getContext('2d')

    if (layers.length === 0 && layer) {
        layers = [layer]
    }

    const canvasWidth = Math.max(canvas.offsetWidth, canvas.width)
    const canvasHeight = Math.max(canvas.offsetHeight, canvas.height)
    let actualSize = {
        width: canvasWidth,
        height: canvasHeight,
    }
    if (img) {
        let ratio
        const hRatio = canvasWidth / img.width
        const vRatio = canvasHeight / img.height
        if (options.fixedWidth) {
            ratio = hRatio
        } else if (options.fixedHeight) {
            ratio = vRatio
        } else {
            ratio = Math.min(hRatio, vRatio)
        }
        actualSize = {
            width: img.width * ratio,
            height: img.height * ratio,
        }
    }

    canvas.width = actualSize.width
    canvas.height = actualSize.height

    layers.map((la, index) => {
        if (!la) {
            return
        }

        ctx.drawImage(la, 0, 0, la.width, la.height, 0, 0, actualSize.width, actualSize.height)
    })
}

/* 画渐变标尺 */
function drawGradient({ gradientCfg, extrema, width, height, type = 'maxPercent' }) {
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const padding = width * 0.02
    const [paddingL, paddingT, paddingR, paddingB] = [padding, padding, padding, padding / 4]
    const graW = width * 0.13
    const graH = height * 0.008
    const fontSize = width * 0.016
    const bgW = graW + paddingL + paddingR
    const bgH = graH + paddingT + paddingB
    ctx.fillStyle = 'rgba(0,0,0, 0.5)'

    // 黑色半透明底色
    ctx.fillRect(width - bgW, height - bgH, bgW, bgH)

    // 渐变
    const x0 = width - paddingR - graW
    const y0 = height - paddingB - graH
    const x1 = width - paddingR
    const y1 = height - paddingB

    const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
    for (let key in gradientCfg) {
        gradient.addColorStop(key, gradientCfg[key])
    }
    ctx.fillStyle = gradient
    ctx.fillRect(x0, y0, graW, graH)

    // 极值
    ctx.font = `normal ${fontSize}px Microsoft YaHei`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    const textBottom = height - graH - paddingB * 1.5
    const { min = 0, max = 0, total } = extrema

    let unit = ''
    let fix = 0
    let minValue = min
    let middleValue = (min + max) / 2
    let maxValue = max

    if (total !== 0 && type === 'maxPercent') {
        unit = '%'
        fix = 1
        minValue = (min / total) * 100
        middleValue = ((min + max) / 2 / total) * 100
        maxValue = (max / total) * 100
    }

    const fillTexts = [
        {
            text: minValue.toFixed(fix) + unit,
            x: width - bgW + paddingB,
            y: textBottom,
        },
        {
            text: middleValue.toFixed(fix) + unit,
            x: width - bgW + graW / 2,
            y: textBottom,
        },
        {
            text: maxValue.toFixed(fix) + unit,
            x: width - paddingR * 2,
            y: textBottom,
        },
    ]

    // eslint-disable-next-line array-callback-return
    fillTexts.map((item) => {
        const { text, x, y } = item
        ctx.fillText(text, x, y)
    })

    return canvas
}

export function getImageInfo(path) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            resolve(img)
        }
        img.onerror = (e) => {
            reject(e)
        }
        img.src = path
    })
}

export function drawHeatmap({
    points,
    directionPoints,
    path,
    canvas,
    type = 'maxPercent',
    accuracy = 33,
    radius,
    options = {},
}) {
    return getImageInfo(path)
        .then((img) => {
            const { width, height } = img
            radius = radius || Math.max(width, height) / accuracy
            points = points.map(({ x, y, value }) => {
                x = x * width
                y = y * height
                return { x, y, value }
            })

            let obj = {}
            obj.data = points

            const heatmapInstance = heatmap.create({
                opacity: 0.6,
                width,
                height,
                radius,
            })

            heatmapInstance.setData(obj)
            return { img, heatmapInstance }
        })
        .then(({ img, heatmapInstance }) => {
            const { width, height } = img
            const gradientCfg = heatmapInstance.getGradient()
            const extrema = heatmapInstance.getExtremaData()
            const gradientCanvas = drawGradient({
                gradientCfg,
                extrema,
                width,
                height,
                type,
            })

            let directionCanvas = null

            if (directionPoints && directionPoints.length > 0) {
                directionCanvas = drawDirection({
                    points: directionPoints,
                    width,
                    height,
                    accuracy: 6,
                    filtration: 0.03,
                })
            }

            const layers = [img, heatmapInstance.getCanvas(), directionCanvas, gradientCanvas]
            drawImageScaled({ img, layers, canvas, options })
            return { img, heatmap: heatmapInstance }
        })
}
// 坐标为文本基准线中点
export function drawText(
    canvas,
    text = '',
    centerPoint = [0, 0],
    {
        fontSize = 20,
        fontFamily = 'PingFangSC-Regular',
        color = '#000',
        usePercent = true,
        border,
    } = {}
) {
    const { width: w, height: h } = canvas
    const [x, y] = usePercent ? getAbsPoint(centerPoint, w, h) : centerPoint
    const ctx = canvas.getContext('2d')
    if (border) {
        const { width } = ctx.measureText(text)
        drawTextBorder(
            canvas,
            [x, y],
            Object.assign({}, border, { textWidth: width, fontSize, usePercent: false })
        )
    }
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
}

export function drawTextBorder(
    canvas,
    textBaseLineCenterPoint = [0, 0],
    { padding = 0, radius, textWidth, width, color, fontSize, backgroundColor, usePercent }
) {
    const [x, y] = textBaseLineCenterPoint
    let paddingL, paddingT
    if (typeof padding === 'number') {
        paddingL = paddingT = padding
    } else if (Array.isArray(padding)) {
        paddingT = padding[0]
        paddingL = padding[1]
    }
    const rectWidth = paddingL * 2 + textWidth
    const rectHeight = paddingT * 2 + fontSize
    const rectL = x - rectWidth / 2
    const rectT = y - fontSize - paddingT
    const leftTopPoint = [rectL, rectT]
    if (radius) {
        drawRoundRect(canvas, leftTopPoint, {
            radius,
            width: rectWidth,
            height: rectHeight,
            lineWidth: width || 1,
            lineColor: color,
            backgroundColor: backgroundColor,
            usePercent: false,
        })
    } else {
        drawRect(canvas, leftTopPoint, {
            width: rectWidth,
            height: rectHeight,
            lineWidth: width || 1,
            lineColor: color,
            backgroundColor: backgroundColor,
            usePercent: false,
        })
    }
}

export function drawPolygon(
    canvas,
    points,
    { color = 'red', usePercent = true, lineWidth, backgroundColor }
) {
    const { width: w, height: h } = canvas
    const l = points.length
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    const startPoint = usePercent ? getAbsPoint(points[0], w, h) : points[0]
    ctx.moveTo(...startPoint)
    for (let i = 1; i < l; i++) {
        const p = usePercent ? getAbsPoint(points[i], w, h) : points[i]
        ctx.lineTo(...p)
    }
    ctx.lineTo(...startPoint)
    if (lineWidth) {
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = color
        ctx.stroke()
    }
    if (backgroundColor) {
        ctx.fillStyle = backgroundColor
        ctx.fill()
    }
}

export function drawRoundRect(
    canvas,
    leftTopPoint,
    {
        width,
        height,
        radius = 4,
        lineWidth,
        lineColor = 'red',
        backgroundColor,
        usePercent = true,
    } = {}
) {
    const { width: w, height: h } = canvas
    const ctx = canvas.getContext('2d')
    const [x, y] = usePercent ? getAbsPoint(leftTopPoint, w, h) : leftTopPoint
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + width, y)
    ctx.arc(x + width, y + radius, radius, -0.5 * Math.PI, 0)
    ctx.lineTo(x + width + radius, y + radius + height)
    ctx.arc(x + width, y + height + radius, radius, 0, 0.5 * Math.PI)
    ctx.lineTo(x, y + height + 2 * radius)
    ctx.arc(x, y + radius + height, radius, 0.5 * Math.PI, 1 * Math.PI)
    ctx.lineTo(x - radius, y + radius)
    ctx.arc(x, y + radius, radius, 1 * Math.PI, 1.5 * Math.PI)
    if (backgroundColor) {
        ctx.fillStyle = backgroundColor
        ctx.fill()
    }
    if (lineWidth) {
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = lineColor
        ctx.stroke()
    }
}

export function drawRect(
    canvas,
    leftTopPoint,
    { width, height, lineWidth, lineColor = 'red', backgroundColor, usePercent = true }
) {
    const { width: canvasWidth, height: canvasHeight } = canvas
    const ctx = canvas.getContext('2d')
    const [x, y] = usePercent ? getAbsPoint(leftTopPoint, canvasWidth, canvasHeight) : leftTopPoint
    const w = usePercent ? width * canvasWidth : width
    const h = usePercent ? height * canvasHeight : height

    if (backgroundColor) {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(x, y, w, h)
    }
    if (lineWidth) {
        ctx.strokeStyle = lineColor
        ctx.lineWidth = lineWidth
        ctx.strokeRect(x, y, w, h)
    }
}

function getAbsPoint(point, w, h) {
    return [w * point[0], h * point[1]]
}

function getPointsTotalAndMax(points) {
    let total = 0
    let maxDirectionValue = 0
    let maxValue = 0
    points.map(function(point) {
        // console.log(point[0]*w, point[1]*h)
        let isPointArray = Array.isArray(point),
            value = isPointArray ? 1 : point.value
        total += value

        maxDirectionValue = point.max > maxDirectionValue ? point.max : maxDirectionValue
        maxValue = point.value > maxValue ? point.value : maxValue
    })
    return { total, maxDirectionValue, maxValue }
}

function canvasArrow(ctx, fromx, fromy, tox, toy, lineWidth) {
    const canvasGradient = ctx.createLinearGradient(fromx, fromy, tox, toy)
    canvasGradient.addColorStop(0, 'rgba(255, 239, 120, 0)')
    canvasGradient.addColorStop(0.5, 'rgba(255, 239, 120, 1)')
    //canvasGradient.addColorStop(1, "rgba(255, 239, 120, 1)")
    ctx.strokeStyle = canvasGradient

    const headlen = lineWidth, // length of head in pixels
        angle = Math.atan2(toy - fromy, tox - fromx)

    ctx.moveTo(fromx, fromy)
    ctx.lineTo(tox, toy)
    ctx.moveTo(tox, toy)
    ctx.lineTo(
        tox - headlen * Math.cos(angle - Math.PI / 7),
        toy - headlen * Math.sin(angle - Math.PI / 7)
    )

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(
        tox - headlen * Math.cos(angle + Math.PI / 7),
        toy - headlen * Math.sin(angle + Math.PI / 7)
    )

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(tox, toy)
    ctx.lineTo(
        tox - headlen * Math.cos(angle - Math.PI / 7),
        toy - headlen * Math.sin(angle - Math.PI / 7)
    )
}

export function drawDirection({ points, width, height, accuracy = 6, filtration = 0.03 }) {
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const { maxValue } = getPointsTotalAndMax(points)

    const minImgLength = Math.min(width, height)

    const maxLinelength = Math.round(minImgLength / accuracy) / 2
    const lineWidth = maxLinelength * 0.06
    ctx.lineWidth = lineWidth

    points.map((point) => {
        // value: 一个区域的总人数
        const { direction, x, y, value, max } = point
        ctx.beginPath()

        // 大于最大值的某个范围才画轨迹线
        if (value / maxValue > filtration) {
            direction.map((item) => {
                ctx.beginPath()

                let fromx = Math.round(width * x)
                let fromy = Math.round(height * y)

                const { label, count } = item

                // 预留顶点坐标周围的空白
                const offset = 0

                let tox = 0
                let toy = 0

                const lineLength = maxLinelength * (count / max)

                // 后方
                if (label === 0) {
                    tox = fromx
                    toy = fromy + offset + lineLength
                    fromy = fromy + offset
                }
                // 前方
                if (label === 1) {
                    tox = fromx
                    toy = fromy - offset - lineLength
                    fromy = fromy - offset
                }
                // 左方
                if (label === 2) {
                    tox = fromx - offset - lineLength
                    toy = fromy
                    fromx = fromx - offset
                }
                // 右方
                if (label === 3) {
                    tox = fromx + offset + lineLength
                    toy = fromy
                    fromx = fromx + offset
                }

                // 左后方
                if (label === 4) {
                    const pow2 = Math.pow(lineLength, 2)
                    const lengthXY = Math.pow(pow2 / 2, 0.5)
                    tox = fromx - offset - lengthXY
                    toy = fromy + offset + lengthXY
                    fromx = fromx - offset
                    fromy = fromy + offset
                }
                // 左前方
                if (label === 5) {
                    const pow2 = Math.pow(lineLength, 2)
                    const lengthXY = Math.pow(pow2 / 2, 0.5)
                    tox = fromx - offset - lengthXY
                    toy = fromy - offset - lengthXY
                    fromx = fromx - offset
                    fromy = fromy - offset
                }
                // 右后方
                if (label === 6) {
                    const pow2 = Math.pow(lineLength, 2)
                    const lengthXY = Math.pow(pow2 / 2, 0.5)
                    tox = fromx + offset + lengthXY
                    toy = fromy + offset + lengthXY
                    fromx = fromx + offset
                    fromy = fromy + offset
                }
                // 右前方
                if (label === 7) {
                    const pow2 = Math.pow(lineLength, 2)
                    const lengthXY = Math.pow(pow2 / 2, 0.5)
                    tox = fromx + offset + lengthXY
                    toy = fromy - offset - lengthXY
                    fromx = fromx + offset
                    fromy = fromy - offset
                }

                if (tox !== 0 && toy !== 0) {
                    canvasArrow(ctx, fromx, fromy, tox, toy, lineWidth)
                }
                ctx.stroke()
            })
        }
    })
    return canvas
}

function getExtremeValueForTrack(tracks) {
    let maxCount = 0
    let minCount = 0
    tracks.map((item, i) => {
        const { count } = item

        maxCount = Math.max(count, maxCount)
        if (i === 0) {
            minCount = count
        } else {
            minCount = Math.min(count, minCount)
        }
    })
    return { minCount, maxCount }
}

function canvasArrowForTrack(ctx, fromx, fromy, tox, toy, maxLineWidth) {
    const headlen = maxLineWidth * 0.2
    const angle = Math.atan2(toy - fromy, tox - fromx)
    const num = 10

    ctx.moveTo(fromx, fromy)
    ctx.lineTo(tox, toy)
    ctx.moveTo(tox, toy)
    ctx.lineTo(
        tox - headlen * Math.cos(angle - Math.PI / num),
        toy - headlen * Math.sin(angle - Math.PI / num)
    )

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(
        tox - headlen * Math.cos(angle + Math.PI / num),
        toy - headlen * Math.sin(angle + Math.PI / num)
    )

    //path from the side point back to the tip of the arrow, and then again to the opposite side point
    ctx.lineTo(tox, toy)
    ctx.lineTo(
        tox - headlen * Math.cos(angle - Math.PI / num),
        toy - headlen * Math.sin(angle - Math.PI / num)
    )
    ctx.fill()
}

function getTrackCanvas({ width, height, tracks }) {
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const { minCount, maxCount } = getExtremeValueForTrack(tracks)
    const diff = maxCount - minCount

    const color = 'rgba(255, 239, 120, 0.5)'
    ctx.strokeStyle = color
    ctx.fillStyle = color

    const minImgLength = Math.min(width, height)
    const maxLineWidth = minImgLength * 0.015

    tracks.map((linePoint) => {
        ctx.beginPath()

        const count = linePoint.count
        const lineWidth = ((count - minCount) / diff) * maxLineWidth + 1

        ctx.lineWidth = lineWidth
        const points = linePoint.points || linePoint.walkPoints || []

        points.map((point, index) => {
            if (index >= 1) {
                const fromx = Math.round(width * points[index - 1].x)
                const fromy = Math.round(height * points[index - 1].y)

                const tox = Math.round(width * point.x)
                const toy = Math.round(height * point.y)
                canvasArrowForTrack(ctx, fromx, fromy, tox, toy, maxLineWidth)
            }
        })
        ctx.stroke()
    })
    return canvas
}

export function drawTrack({ path, tracks, canvas }) {
    return getImageInfo(path).then((img) => {
        const { width, height } = img

        const trackCanvas = getTrackCanvas({ width, height, tracks })

        const layers = [img, trackCanvas]

        drawImageScaled({ img, layers, canvas })
        return { img }
    })
}
