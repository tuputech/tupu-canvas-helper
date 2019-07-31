'use strict'

const HeatmapConfig = {
    // 默认半径: radius
    defaultRadius: 40,
    // 渲染主体: 目前只有dom端。只实现了canvas2d, 其他还可以自己渲染
    // todo: 小程序, node端
    defaultRenderer: 'canvas2d',
    // 渐变的梯度, 定义热力红点
    defaultGradient: {
        0.25: 'rgb(0,0,255)',
        0.55: 'rgb(0,255,0)',
        0.85: 'rgb(255,255,0)',
        1.0: 'rgb(255,0,0)',
    },
    // 透明度
    defaultMaxOpacity: 1,
    defaultMinOpacity: 0,

    // 模糊设定
    defaultBlur: 0.85,

    // 坐标的x轴
    defaultXField: 'x',
    // 坐标的y轴
    defaultYField: 'y',
    // 坐标的权重key值
    defaultValueField: 'value',
    // 热力图的插件
    plugins: {},

    // 代码用到的

    // canvas使用到的容器。
    // 不传container直接传canvas也是可以的
    container: null,
    // canvas主体
    canvas: null,
    // canvas backgroundColor
    backgroundColor: '',
    // canvas的长宽, 不用带px。
    // 不传默认取container的长宽
    width: '',
    height: '',
    // 是否使用渐变透明度
    useGradientOpacity: false,
}

export default HeatmapConfig
