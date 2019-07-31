'use strict'

import HeatmapConfig from './config'

const Store = function Store(config) {
    this._coordinator = {}
    this._data = []
    this._total = 0
    this._radi = []
    this._min = 10
    this._max = 1
    this._xField = config['xField'] || config.defaultXField
    this._yField = config['yField'] || config.defaultYField
    this._valueField = config['valueField'] || config.defaultValueField

    if (config['radius']) {
        this._cfgRadius = config['radius']
    }
}

const defaultRadius = HeatmapConfig.defaultRadius

Store.prototype = {
    // when forceRender = false -> called from setData, omits renderall event
    _organiseData: function(dataPoint, forceRender) {
        const x = dataPoint[this._xField]
        const y = dataPoint[this._yField]
        const radi = this._radi
        const store = this._data
        const max = this._max
        const min = this._min
        const value = dataPoint[this._valueField] || 1
        const radius = dataPoint.radius || this._cfgRadius || defaultRadius

        if (!store[x]) {
            store[x] = []
            radi[x] = []
        }

        if (!store[x][y]) {
            store[x][y] = value
            radi[x][y] = radius
        } else {
            store[x][y] += value
        }
        const storedVal = store[x][y]

        this._total += storedVal

        if (storedVal > max) {
            if (!forceRender) {
                this._max = storedVal
            } else {
                this.setDataMax(storedVal)
            }
            return false
        } else if (storedVal < min) {
            if (!forceRender) {
                this._min = storedVal
            } else {
                this.setDataMin(storedVal)
            }
            return false
        } else {
            return {
                x: x,
                y: y,
                value: value,
                radius: radius,
                min: min,
                max: max,
            }
        }
    },
    _unOrganizeData: function() {
        const unorganizedData = []
        const data = this._data
        const radi = this._radi

        for (const x in data) {
            for (const y in data[x]) {
                unorganizedData.push({
                    x: x,
                    y: y,
                    radius: radi[x][y],
                    value: data[x][y],
                })
            }
        }
        return {
            min: this._min,
            max: this._max,
            data: unorganizedData,
        }
    },
    _onExtremaChange: function() {
        this._coordinator.emit('extremachange', {
            min: this._min,
            max: this._max,
        })
    },
    addData: function() {
        if (arguments[0].length > 0) {
            const dataArr = arguments[0]
            let dataLen = dataArr.length
            while (dataLen--) {
                // eslint-disable-next-line no-useless-call
                this.addData.call(this, dataArr[dataLen])
            }
        } else {
            // add to store
            const organisedEntry = this._organiseData(arguments[0], true)
            if (organisedEntry) {
                // if it's the first datapoint initialize the extremas with it
                if (this._data.length === 0) {
                    this._min = this._max = organisedEntry.value
                }
                this._coordinator.emit('renderpartial', {
                    min: this._min,
                    max: this._max,
                    data: [organisedEntry],
                })
            }
        }
        return this
    },
    getExtremaData: function() {
        return {
            max: this._max,
            min: this._min,
            total: this._total,
        }
    },
    setData: function(obj) {
        const { data, max, min } = obj
        const dataPoints = data
        const pointsLen = dataPoints.length

        // reset data arrays
        this._data = []
        this._radi = []

        for (let i = 0; i < pointsLen; i++) {
            this._organiseData(dataPoints[i], false)
        }

        if (max || min) {
            this._max = max
            this._min = min || 0
        }

        this._onExtremaChange()
        this._coordinator.emit('renderall', this._getInternalData())
        return this
    },
    setCoordinator: function(coordinator) {
        this._coordinator = coordinator
    },
    _getInternalData: function() {
        return {
            max: this._max,
            min: this._min,
            data: this._data,
            radi: this._radi,
        }
    },
    getData: function() {
        return this._unOrganizeData()
    },
}

export default Store
