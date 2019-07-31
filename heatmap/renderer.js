'use strict'

import HeatmapConfig from './config'
import Canvas2dRenderer from './canvas2d'

const Renderer = HeatmapConfig['defaultRenderer'] === 'canvas2d' ? Canvas2dRenderer : false

export default Renderer
