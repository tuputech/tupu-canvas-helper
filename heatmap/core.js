'use strict'

import HeatmapConfig from './config'
import Renderer from './renderer'
import Store from './data'

/**
 * 自定义监听器
 * on: 监听
 * emit: 触发事件
 */
function Coordinator() {
    this.cStore = {}
}

Coordinator.prototype = {
    on: function(evtName, callback, scope) {
        const cStore = this.cStore

        if (!cStore[evtName]) {
            cStore[evtName] = []
        }
        cStore[evtName].push(function(data) {
            return callback.call(scope, data)
        })
    },
    emit: function(evtName, data) {
        const cStore = this.cStore
        if (cStore[evtName]) {
            const len = cStore[evtName].length
            for (let i = 0; i < len; i++) {
                const callback = cStore[evtName][i]
                callback(data)
            }
        }
    },
}

const _connect = function(scope) {
    const renderer = scope._renderer
    const coordinator = scope._coordinator
    const store = scope._store

    // 监听渲染部分
    coordinator.on('renderpartial', renderer.renderPartial, renderer)
    // 监听渲染全部
    coordinator.on('renderall', renderer.renderAll, renderer)

    // 监听min, max是否发生变化。
    // 可以在set config设置回调。
    coordinator.on('extremachange', function(data) {
        scope._config.onExtremaChange &&
            scope._config.onExtremaChange({
                min: data.min,
                max: data.max,
                gradient: scope._config['gradient'] || scope._config['defaultGradient'],
            })
    })

    store.setCoordinator(coordinator)
}

function Heatmap(config = {}) {
    config = this._config = Object.assign(HeatmapConfig, config)
    this._coordinator = new Coordinator()

    /**
     * 用户自定义的插件, 使用前需要注册插件
     * 插件需要自带renderer和store属性
     */
    if (config['plugin']) {
        const pluginToLoad = config['plugin']
        if (!HeatmapConfig.plugins[pluginToLoad]) {
            throw new Error("Plugin '" + pluginToLoad + "' not found. Maybe it was not registered.")
        } else {
            const plugin = HeatmapConfig.plugins[pluginToLoad]
            // set plugin renderer and store
            // eslint-disable-next-line new-cap
            this._renderer = new plugin.renderer(config)
            // eslint-disable-next-line new-cap
            this._store = new plugin.store(config)
        }
    } else {
        // init canvas2d
        // container appendChild canvas
        // 初始化调色板
        // get到canvas的属性/样式
        this._renderer = new Renderer(config)

        // init store
        this._store = new Store(config)
    }
    _connect(this)
}

// @TODO:
// add API documentation
Heatmap.prototype = {
    addData: function() {
        this._store.addData.apply(this._store, arguments)
        return this
    },
    removeData: function() {
        this._store.removeData && this._store.removeData.apply(this._store, arguments)
        return this
    },
    setData: function() {
        this._store.setData.apply(this._store, arguments)
        return this
    },
    setDataMax: function() {
        this._store.setDataMax.apply(this._store, arguments)
        return this
    },
    setDataMin: function() {
        this._store.setDataMin.apply(this._store, arguments)
        return this
    },
    configure: function(config) {
        this._config = Object.assign(this._config, config)
        this._renderer.updateConfig(this._config)
        this._coordinator.emit('renderall', this._store._getInternalData())
        return this
    },
    repaint: function() {
        this._coordinator.emit('renderall', this._store._getInternalData())
        return this
    },
    getData: function() {
        return this._store.getData()
    },
    getDataURL: function() {
        return this._renderer.getDataURL()
    },
    getCanvas: function() {
        return this._renderer.getCanvas()
    },
    getGradient: function() {
        return this._config['gradient'] || this._config['defaultGradient']
    },
    getExtremaData: function() {
        return this._store.getExtremaData()
    },
    getValueAt: function(point) {
        if (this._store.getValueAt) {
            return this._store.getValueAt(point)
        } else if (this._renderer.getValueAt) {
            return this._renderer.getValueAt(point)
        } else {
            return null
        }
    },
}

// core
const heatmapFactory = {
    create: function(config) {
        return new Heatmap(config)
    },
    register: function(pluginKey, plugin) {
        HeatmapConfig.plugins[pluginKey] = plugin
    },
}

export default heatmapFactory
