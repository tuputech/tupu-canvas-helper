const _getColorPalette = function(config) {
    const gradientConfig = config.gradient || config.defaultGradient
    const paletteCanvas = document.createElement('canvas')
    const paletteCtx = paletteCanvas.getContext('2d')

    paletteCanvas.width = 256
    paletteCanvas.height = 1

    // 创建canvas渐变对象
    // params(x0,y0,x1,y1)
    // 开始点坐标(x0,y0), 结束点坐标(x1, y1)
    const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1)
    for (let key in gradientConfig) {
        gradient.addColorStop(key, gradientConfig[key])
    }

    paletteCtx.fillStyle = gradient
    // params(x,y,width,height)
    // x: 矩形左上角的x坐标
    // y: 矩形左上角的y坐标
    paletteCtx.fillRect(0, 0, 256, 1)

    // 返回ImageData 对象，该对象拷贝了画布指定矩形的像素数据。
    const { data } = paletteCtx.getImageData(0, 0, 256, 1)
    return data
}

const _getPointTemplate = function(radius, blurFactor) {
    const tplCanvas = document.createElement('canvas')
    const tplCtx = tplCanvas.getContext('2d')
    const x = radius
    const y = radius
    tplCanvas.width = tplCanvas.height = radius * 2

    if (blurFactor === 1) {
        tplCtx.beginPath()
        tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false)
        tplCtx.fillStyle = 'rgba(0,0,0,1)'
        tplCtx.fill()
    } else {
        // 里黑外白
        const gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius)
        gradient.addColorStop(0, 'rgba(0,0,0,1)')
        gradient.addColorStop(1, 'rgba(0,0,0,0)')
        tplCtx.fillStyle = gradient
        tplCtx.fillRect(0, 0, 2 * radius, 2 * radius)
    }

    return tplCanvas
}

const _prepareData = function(obj) {
    const { min, max, radi, data } = obj
    const renderData = []

    const xValues = Object.keys(data)
    let xValuesLen = xValues.length

    while (xValuesLen--) {
        const xValue = xValues[xValuesLen]
        const yValues = Object.keys(data[xValue])
        let yValuesLen = yValues.length
        while (yValuesLen--) {
            const yValue = yValues[yValuesLen]
            const value = data[xValue][yValue]
            const radius = radi[xValue][yValue]
            renderData.push({
                x: xValue,
                y: yValue,
                value: value,
                radius: radius,
            })
        }
    }

    return {
        min,
        max,
        data: renderData,
    }
}

function Canvas2dRenderer(config) {
    const container = config.container
    // shadowCanvas外面不能配置?
    const shadowCanvas = (this.shadowCanvas = document.createElement('canvas'))
    const canvas = (this.canvas = config.canvas || document.createElement('canvas'))
    // 原点的边界
    this._renderBoundaries = [10000, 10000, 0, 0]

    // 浏览器api, 获取容器的真实长宽。再set给shadowCanvas和canvas
    // eslint-disable-next-line no-undef
    const computed = config.container ? getComputedStyle(config.container) : {}

    canvas.className = 'heatmap-canvas'

    this._width = canvas.width = shadowCanvas.width =
        config.width || +computed.width.replace(/px/, '')
    this._height = canvas.height = shadowCanvas.height =
        config.height || +computed.height.replace(/px/, '')

    this.shadowCtx = shadowCanvas.getContext('2d')
    this.ctx = canvas.getContext('2d')

    // @TODO:
    // conditional wrapper
    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;'

    if (container) {
        container.style.position = 'relative'
        container.appendChild(canvas)
    }

    // init 调色板;
    // 返回 ImageData.data
    this._palette = _getColorPalette(config)
    this._templates = {}

    // inin Styles
    this._setStyles(config)
}

Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
        if (data.data.length > 0) {
            this._drawAlpha(data)
            this._colorize()
        }
    },
    renderAll: function(data) {
        // reset render boundaries
        this._clear()
        if (Object.keys(data.data).length > 0) {
            this._drawAlpha(_prepareData(data))
            this._colorize()
        }
    },
    _updateGradient: function(config) {
        this._palette = _getColorPalette(config)
    },
    updateConfig: function(config) {
        if (config['gradient']) {
            this._updateGradient(config)
        }
        this._setStyles(config)
    },
    setDimensions: function(width, height) {
        this._width = width
        this._height = height
        this.canvas.width = this.shadowCanvas.width = width
        this.canvas.height = this.shadowCanvas.height = height
    },
    _clear: function() {
        this.shadowCtx.clearRect(0, 0, this._width, this._height)
        this.ctx.clearRect(0, 0, this._width, this._height)
    },
    _setStyles: function(config) {
        this._blur = config.blur === 0 ? 0 : config.blur || config.defaultBlur

        if (config.backgroundColor) {
            this.canvas.style.backgroundColor = config.backgroundColor
        }

        this._width = this.canvas.width = this.shadowCanvas.width = config.width || this._width
        this._height = this.canvas.height = this.shadowCanvas.height = config.height || this._height

        this._opacity = (config.opacity || 0) * 255
        this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255
        this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255
        this._useGradientOpacity = !!config.useGradientOpacity
    },
    _drawAlpha: function(obj) {
        const min = (this._min = obj.min)
        const max = (this._max = obj.max)
        const data = obj.data || []
        let dataLen = data.length
        // on a point basis?
        const blur = 1 - this._blur

        while (dataLen--) {
            const point = data[dataLen]

            const x = point.x
            const y = point.y
            const radius = point.radius
            // if value is bigger than max
            // use max as value
            const value = Math.min(point.value, max)
            const rectX = x - radius
            const rectY = y - radius
            const shadowCtx = this.shadowCtx

            let tpl
            if (!this._templates[radius]) {
                this._templates[radius] = tpl = _getPointTemplate(radius, blur)
            } else {
                tpl = this._templates[radius]
            }
            // value from minimum / value range
            // => [0, 1]
            const templateAlpha = max - min === 0 ? 1 : (value - min) / (max - min)
            // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
            shadowCtx.globalAlpha = templateAlpha < 0.01 ? 0.01 : templateAlpha

            // 左上角画一张图, 黑白色
            shadowCtx.drawImage(tpl, rectX, rectY)

            // update renderBoundaries
            if (rectX < this._renderBoundaries[0]) {
                this._renderBoundaries[0] = rectX
            }
            if (rectY < this._renderBoundaries[1]) {
                this._renderBoundaries[1] = rectY
            }
            if (rectX + 2 * radius > this._renderBoundaries[2]) {
                this._renderBoundaries[2] = rectX + 2 * radius
            }
            if (rectY + 2 * radius > this._renderBoundaries[3]) {
                this._renderBoundaries[3] = rectY + 2 * radius
            }
        }
    },
    _colorize: function() {
        let x = this._renderBoundaries[0]
        let y = this._renderBoundaries[1]
        let width = this._renderBoundaries[2] - x
        let height = this._renderBoundaries[3] - y
        const maxWidth = this._width
        const maxHeight = this._height
        const opacity = this._opacity
        const maxOpacity = this._maxOpacity
        const minOpacity = this._minOpacity
        const useGradientOpacity = this._useGradientOpacity

        if (x < 0) {
            x = 0
        }
        if (y < 0) {
            y = 0
        }
        if (x + width > maxWidth) {
            width = maxWidth - x
        }
        if (y + height > maxHeight) {
            height = maxHeight - y
        }

        let img = this.shadowCtx.getImageData(x, y, width, height)
        const imgData = img.data
        const len = imgData.length
        const palette = this._palette

        for (let i = 3; i < len; i += 4) {
            // alpha代表透明度。数值越打代表越 range(0, 255)

            // palette.length = 256 * 1 * 4
            const alpha = imgData[i]
            const offset = alpha * 4

            if (!offset) {
                continue
            }

            let finalAlpha
            if (opacity > 0) {
                // 本来已经有一个透明度了
                finalAlpha = opacity * (alpha / 256)
            } else {
                if (alpha < maxOpacity) {
                    if (alpha < minOpacity) {
                        finalAlpha = minOpacity
                    } else {
                        finalAlpha = alpha
                    }
                } else {
                    finalAlpha = maxOpacity
                }
            }

            imgData[i - 3] = palette[offset]
            imgData[i - 2] = palette[offset + 1]
            imgData[i - 1] = palette[offset + 2]
            // console.log('useGradientOpacity', useGradientOpacity)
            // console.log('finalAlpha', finalAlpha)
            imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha
        }

        // img.data = imgData
        this.ctx.putImageData(img, x, y)

        this._renderBoundaries = [1000, 1000, 0, 0]
    },
    getValueAt: function(point) {
        let value
        const shadowCtx = this.shadowCtx
        const img = shadowCtx.getImageData(point.x, point.y, 1, 1)
        const data = img.data[3]
        const max = this._max
        const min = this._min

        value = (Math.abs(max - min) * (data / 255)) >> 0

        return value
    },
    getDataURL: function() {
        return this.canvas.toDataURL()
    },
    getCanvas: function() {
        return this.canvas
    },
}

export default Canvas2dRenderer
