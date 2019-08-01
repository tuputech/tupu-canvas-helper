// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"heatmap/config.js":[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var HeatmapConfig = {
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
    1.0: 'rgb(255,0,0)'
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
  useGradientOpacity: false
};
var _default = HeatmapConfig;
exports.default = _default;
},{}],"heatmap/canvas2d.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _getColorPalette = function _getColorPalette(config) {
  var gradientConfig = config.gradient || config.defaultGradient;
  var paletteCanvas = document.createElement('canvas');
  var paletteCtx = paletteCanvas.getContext('2d');
  paletteCanvas.width = 256;
  paletteCanvas.height = 1; // 创建canvas渐变对象
  // params(x0,y0,x1,y1)
  // 开始点坐标(x0,y0), 结束点坐标(x1, y1)

  var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);

  for (var key in gradientConfig) {
    gradient.addColorStop(key, gradientConfig[key]);
  }

  paletteCtx.fillStyle = gradient; // params(x,y,width,height)
  // x: 矩形左上角的x坐标
  // y: 矩形左上角的y坐标

  paletteCtx.fillRect(0, 0, 256, 1); // 返回ImageData 对象，该对象拷贝了画布指定矩形的像素数据。

  var _paletteCtx$getImageD = paletteCtx.getImageData(0, 0, 256, 1),
      data = _paletteCtx$getImageD.data;

  return data;
};

var _getPointTemplate = function _getPointTemplate(radius, blurFactor) {
  var tplCanvas = document.createElement('canvas');
  var tplCtx = tplCanvas.getContext('2d');
  var x = radius;
  var y = radius;
  tplCanvas.width = tplCanvas.height = radius * 2;

  if (blurFactor === 1) {
    tplCtx.beginPath();
    tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
    tplCtx.fillStyle = 'rgba(0,0,0,1)';
    tplCtx.fill();
  } else {
    // 里黑外白
    var gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    tplCtx.fillStyle = gradient;
    tplCtx.fillRect(0, 0, 2 * radius, 2 * radius);
  }

  return tplCanvas;
};

var _prepareData = function _prepareData(obj) {
  var min = obj.min,
      max = obj.max,
      radi = obj.radi,
      data = obj.data;
  var renderData = [];
  var xValues = Object.keys(data);
  var xValuesLen = xValues.length;

  while (xValuesLen--) {
    var xValue = xValues[xValuesLen];
    var yValues = Object.keys(data[xValue]);
    var yValuesLen = yValues.length;

    while (yValuesLen--) {
      var yValue = yValues[yValuesLen];
      var value = data[xValue][yValue];
      var radius = radi[xValue][yValue];
      renderData.push({
        x: xValue,
        y: yValue,
        value: value,
        radius: radius
      });
    }
  }

  return {
    min: min,
    max: max,
    data: renderData
  };
};

function Canvas2dRenderer(config) {
  var container = config.container; // shadowCanvas外面不能配置?

  var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
  var canvas = this.canvas = config.canvas || document.createElement('canvas'); // 原点的边界

  this._renderBoundaries = [10000, 10000, 0, 0]; // 浏览器api, 获取容器的真实长宽。再set给shadowCanvas和canvas
  // eslint-disable-next-line no-undef

  var computed = config.container ? getComputedStyle(config.container) : {};
  canvas.className = 'heatmap-canvas';
  this._width = canvas.width = shadowCanvas.width = config.width || +computed.width.replace(/px/, '');
  this._height = canvas.height = shadowCanvas.height = config.height || +computed.height.replace(/px/, '');
  this.shadowCtx = shadowCanvas.getContext('2d');
  this.ctx = canvas.getContext('2d'); // @TODO:
  // conditional wrapper

  canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';

  if (container) {
    container.style.position = 'relative';
    container.appendChild(canvas);
  } // init 调色板;
  // 返回 ImageData.data


  this._palette = _getColorPalette(config);
  this._templates = {}; // inin Styles

  this._setStyles(config);
}

Canvas2dRenderer.prototype = {
  renderPartial: function renderPartial(data) {
    if (data.data.length > 0) {
      this._drawAlpha(data);

      this._colorize();
    }
  },
  renderAll: function renderAll(data) {
    // reset render boundaries
    this._clear();

    if (Object.keys(data.data).length > 0) {
      this._drawAlpha(_prepareData(data));

      this._colorize();
    }
  },
  _updateGradient: function _updateGradient(config) {
    this._palette = _getColorPalette(config);
  },
  updateConfig: function updateConfig(config) {
    if (config['gradient']) {
      this._updateGradient(config);
    }

    this._setStyles(config);
  },
  setDimensions: function setDimensions(width, height) {
    this._width = width;
    this._height = height;
    this.canvas.width = this.shadowCanvas.width = width;
    this.canvas.height = this.shadowCanvas.height = height;
  },
  _clear: function _clear() {
    this.shadowCtx.clearRect(0, 0, this._width, this._height);
    this.ctx.clearRect(0, 0, this._width, this._height);
  },
  _setStyles: function _setStyles(config) {
    this._blur = config.blur === 0 ? 0 : config.blur || config.defaultBlur;

    if (config.backgroundColor) {
      this.canvas.style.backgroundColor = config.backgroundColor;
    }

    this._width = this.canvas.width = this.shadowCanvas.width = config.width || this._width;
    this._height = this.canvas.height = this.shadowCanvas.height = config.height || this._height;
    this._opacity = (config.opacity || 0) * 255;
    this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
    this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
    this._useGradientOpacity = !!config.useGradientOpacity;
  },
  _drawAlpha: function _drawAlpha(obj) {
    var min = this._min = obj.min;
    var max = this._max = obj.max;
    var data = obj.data || [];
    var dataLen = data.length; // on a point basis?

    var blur = 1 - this._blur;

    while (dataLen--) {
      var point = data[dataLen];
      var x = point.x;
      var y = point.y;
      var radius = point.radius; // if value is bigger than max
      // use max as value

      var value = Math.min(point.value, max);
      var rectX = x - radius;
      var rectY = y - radius;
      var shadowCtx = this.shadowCtx;
      var tpl = void 0;

      if (!this._templates[radius]) {
        this._templates[radius] = tpl = _getPointTemplate(radius, blur);
      } else {
        tpl = this._templates[radius];
      } // value from minimum / value range
      // => [0, 1]


      var templateAlpha = max - min === 0 ? 1 : (value - min) / (max - min); // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData

      shadowCtx.globalAlpha = templateAlpha < 0.01 ? 0.01 : templateAlpha; // 左上角画一张图, 黑白色

      shadowCtx.drawImage(tpl, rectX, rectY); // update renderBoundaries

      if (rectX < this._renderBoundaries[0]) {
        this._renderBoundaries[0] = rectX;
      }

      if (rectY < this._renderBoundaries[1]) {
        this._renderBoundaries[1] = rectY;
      }

      if (rectX + 2 * radius > this._renderBoundaries[2]) {
        this._renderBoundaries[2] = rectX + 2 * radius;
      }

      if (rectY + 2 * radius > this._renderBoundaries[3]) {
        this._renderBoundaries[3] = rectY + 2 * radius;
      }
    }
  },
  _colorize: function _colorize() {
    var x = this._renderBoundaries[0];
    var y = this._renderBoundaries[1];
    var width = this._renderBoundaries[2] - x;
    var height = this._renderBoundaries[3] - y;
    var maxWidth = this._width;
    var maxHeight = this._height;
    var opacity = this._opacity;
    var maxOpacity = this._maxOpacity;
    var minOpacity = this._minOpacity;
    var useGradientOpacity = this._useGradientOpacity;

    if (x < 0) {
      x = 0;
    }

    if (y < 0) {
      y = 0;
    }

    if (x + width > maxWidth) {
      width = maxWidth - x;
    }

    if (y + height > maxHeight) {
      height = maxHeight - y;
    }

    var img = this.shadowCtx.getImageData(x, y, width, height);
    var imgData = img.data;
    var len = imgData.length;
    var palette = this._palette;

    for (var i = 3; i < len; i += 4) {
      // alpha代表透明度。数值越打代表越 range(0, 255)
      // palette.length = 256 * 1 * 4
      var alpha = imgData[i];
      var offset = alpha * 4;

      if (!offset) {
        continue;
      }

      var finalAlpha = void 0;

      if (opacity > 0) {
        // 本来已经有一个透明度了
        finalAlpha = opacity * (alpha / 256);
      } else {
        if (alpha < maxOpacity) {
          if (alpha < minOpacity) {
            finalAlpha = minOpacity;
          } else {
            finalAlpha = alpha;
          }
        } else {
          finalAlpha = maxOpacity;
        }
      }

      imgData[i - 3] = palette[offset];
      imgData[i - 2] = palette[offset + 1];
      imgData[i - 1] = palette[offset + 2]; // console.log('useGradientOpacity', useGradientOpacity)
      // console.log('finalAlpha', finalAlpha)

      imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;
    } // img.data = imgData


    this.ctx.putImageData(img, x, y);
    this._renderBoundaries = [1000, 1000, 0, 0];
  },
  getValueAt: function getValueAt(point) {
    var value;
    var shadowCtx = this.shadowCtx;
    var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
    var data = img.data[3];
    var max = this._max;
    var min = this._min;
    value = Math.abs(max - min) * (data / 255) >> 0;
    return value;
  },
  getDataURL: function getDataURL() {
    return this.canvas.toDataURL();
  },
  getCanvas: function getCanvas() {
    return this.canvas;
  }
};
var _default = Canvas2dRenderer;
exports.default = _default;
},{}],"heatmap/renderer.js":[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _config = _interopRequireDefault(require("./config"));

var _canvas2d = _interopRequireDefault(require("./canvas2d"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Renderer = _config.default['defaultRenderer'] === 'canvas2d' ? _canvas2d.default : false;
var _default = Renderer;
exports.default = _default;
},{"./config":"heatmap/config.js","./canvas2d":"heatmap/canvas2d.js"}],"heatmap/data.js":[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _config = _interopRequireDefault(require("./config"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Store = function Store(config) {
  this._coordinator = {};
  this._data = [];
  this._total = 0;
  this._radi = [];
  this._min = 10;
  this._max = 1;
  this._xField = config['xField'] || config.defaultXField;
  this._yField = config['yField'] || config.defaultYField;
  this._valueField = config['valueField'] || config.defaultValueField;

  if (config['radius']) {
    this._cfgRadius = config['radius'];
  }
};

var defaultRadius = _config.default.defaultRadius;
Store.prototype = {
  // when forceRender = false -> called from setData, omits renderall event
  _organiseData: function _organiseData(dataPoint, forceRender) {
    var x = dataPoint[this._xField];
    var y = dataPoint[this._yField];
    var radi = this._radi;
    var store = this._data;
    var max = this._max;
    var min = this._min;
    var value = dataPoint[this._valueField] || 1;
    var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

    if (!store[x]) {
      store[x] = [];
      radi[x] = [];
    }

    if (!store[x][y]) {
      store[x][y] = value;
      radi[x][y] = radius;
    } else {
      store[x][y] += value;
    }

    var storedVal = store[x][y];
    this._total += storedVal;

    if (storedVal > max) {
      if (!forceRender) {
        this._max = storedVal;
      } else {
        this.setDataMax(storedVal);
      }

      return false;
    } else if (storedVal < min) {
      if (!forceRender) {
        this._min = storedVal;
      } else {
        this.setDataMin(storedVal);
      }

      return false;
    } else {
      return {
        x: x,
        y: y,
        value: value,
        radius: radius,
        min: min,
        max: max
      };
    }
  },
  _unOrganizeData: function _unOrganizeData() {
    var unorganizedData = [];
    var data = this._data;
    var radi = this._radi;

    for (var x in data) {
      for (var y in data[x]) {
        unorganizedData.push({
          x: x,
          y: y,
          radius: radi[x][y],
          value: data[x][y]
        });
      }
    }

    return {
      min: this._min,
      max: this._max,
      data: unorganizedData
    };
  },
  _onExtremaChange: function _onExtremaChange() {
    this._coordinator.emit('extremachange', {
      min: this._min,
      max: this._max
    });
  },
  addData: function addData() {
    if (arguments[0].length > 0) {
      var dataArr = arguments[0];
      var dataLen = dataArr.length;

      while (dataLen--) {
        // eslint-disable-next-line no-useless-call
        this.addData.call(this, dataArr[dataLen]);
      }
    } else {
      // add to store
      var organisedEntry = this._organiseData(arguments[0], true);

      if (organisedEntry) {
        // if it's the first datapoint initialize the extremas with it
        if (this._data.length === 0) {
          this._min = this._max = organisedEntry.value;
        }

        this._coordinator.emit('renderpartial', {
          min: this._min,
          max: this._max,
          data: [organisedEntry]
        });
      }
    }

    return this;
  },
  getExtremaData: function getExtremaData() {
    return {
      max: this._max,
      min: this._min,
      total: this._total
    };
  },
  setData: function setData(obj) {
    var data = obj.data,
        max = obj.max,
        min = obj.min;
    var dataPoints = data;
    var pointsLen = dataPoints.length; // reset data arrays

    this._data = [];
    this._radi = [];

    for (var i = 0; i < pointsLen; i++) {
      this._organiseData(dataPoints[i], false);
    }

    if (max || min) {
      this._max = max;
      this._min = min || 0;
    }

    this._onExtremaChange();

    this._coordinator.emit('renderall', this._getInternalData());

    return this;
  },
  setCoordinator: function setCoordinator(coordinator) {
    this._coordinator = coordinator;
  },
  _getInternalData: function _getInternalData() {
    return {
      max: this._max,
      min: this._min,
      data: this._data,
      radi: this._radi
    };
  },
  getData: function getData() {
    return this._unOrganizeData();
  }
};
var _default = Store;
exports.default = _default;
},{"./config":"heatmap/config.js"}],"heatmap/core.js":[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _config = _interopRequireDefault(require("./config"));

var _renderer = _interopRequireDefault(require("./renderer"));

var _data = _interopRequireDefault(require("./data"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * 自定义监听器
 * on: 监听
 * emit: 触发事件
 */
function Coordinator() {
  this.cStore = {};
}

Coordinator.prototype = {
  on: function on(evtName, callback, scope) {
    var cStore = this.cStore;

    if (!cStore[evtName]) {
      cStore[evtName] = [];
    }

    cStore[evtName].push(function (data) {
      return callback.call(scope, data);
    });
  },
  emit: function emit(evtName, data) {
    var cStore = this.cStore;

    if (cStore[evtName]) {
      var len = cStore[evtName].length;

      for (var i = 0; i < len; i++) {
        var callback = cStore[evtName][i];
        callback(data);
      }
    }
  }
};

var _connect = function _connect(scope) {
  var renderer = scope._renderer;
  var coordinator = scope._coordinator;
  var store = scope._store; // 监听渲染部分

  coordinator.on('renderpartial', renderer.renderPartial, renderer); // 监听渲染全部

  coordinator.on('renderall', renderer.renderAll, renderer); // 监听min, max是否发生变化。
  // 可以在set config设置回调。

  coordinator.on('extremachange', function (data) {
    scope._config.onExtremaChange && scope._config.onExtremaChange({
      min: data.min,
      max: data.max,
      gradient: scope._config['gradient'] || scope._config['defaultGradient']
    });
  });
  store.setCoordinator(coordinator);
};

function Heatmap() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  config = this._config = Object.assign(_config.default, config);
  this._coordinator = new Coordinator();
  /**
   * 用户自定义的插件, 使用前需要注册插件
   * 插件需要自带renderer和store属性
   */

  if (config['plugin']) {
    var pluginToLoad = config['plugin'];

    if (!_config.default.plugins[pluginToLoad]) {
      throw new Error("Plugin '" + pluginToLoad + "' not found. Maybe it was not registered.");
    } else {
      var plugin = _config.default.plugins[pluginToLoad]; // set plugin renderer and store
      // eslint-disable-next-line new-cap

      this._renderer = new plugin.renderer(config); // eslint-disable-next-line new-cap

      this._store = new plugin.store(config);
    }
  } else {
    // init canvas2d
    // container appendChild canvas
    // 初始化调色板
    // get到canvas的属性/样式
    this._renderer = new _renderer.default(config); // init store

    this._store = new _data.default(config);
  }

  _connect(this);
} // @TODO:
// add API documentation


Heatmap.prototype = {
  addData: function addData() {
    this._store.addData.apply(this._store, arguments);

    return this;
  },
  removeData: function removeData() {
    this._store.removeData && this._store.removeData.apply(this._store, arguments);
    return this;
  },
  setData: function setData() {
    this._store.setData.apply(this._store, arguments);

    return this;
  },
  setDataMax: function setDataMax() {
    this._store.setDataMax.apply(this._store, arguments);

    return this;
  },
  setDataMin: function setDataMin() {
    this._store.setDataMin.apply(this._store, arguments);

    return this;
  },
  configure: function configure(config) {
    this._config = Object.assign(this._config, config);

    this._renderer.updateConfig(this._config);

    this._coordinator.emit('renderall', this._store._getInternalData());

    return this;
  },
  repaint: function repaint() {
    this._coordinator.emit('renderall', this._store._getInternalData());

    return this;
  },
  getData: function getData() {
    return this._store.getData();
  },
  getDataURL: function getDataURL() {
    return this._renderer.getDataURL();
  },
  getCanvas: function getCanvas() {
    return this._renderer.getCanvas();
  },
  getGradient: function getGradient() {
    return this._config['gradient'] || this._config['defaultGradient'];
  },
  getExtremaData: function getExtremaData() {
    return this._store.getExtremaData();
  },
  getValueAt: function getValueAt(point) {
    if (this._store.getValueAt) {
      return this._store.getValueAt(point);
    } else if (this._renderer.getValueAt) {
      return this._renderer.getValueAt(point);
    } else {
      return null;
    }
  } // core

};
var heatmapFactory = {
  create: function create(config) {
    return new Heatmap(config);
  },
  register: function register(pluginKey, plugin) {
    _config.default.plugins[pluginKey] = plugin;
  }
};
var _default = heatmapFactory;
exports.default = _default;
},{"./config":"heatmap/config.js","./renderer":"heatmap/renderer.js","./data":"heatmap/data.js"}],"index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.drawImageScaled = drawImageScaled;
exports.getImageInfo = getImageInfo;
exports.drawHeatmap = drawHeatmap;
exports.drawText = drawText;
exports.drawTextBorder = drawTextBorder;
exports.drawPolygon = drawPolygon;
exports.drawRoundRect = drawRoundRect;
exports.drawRect = drawRect;
exports.drawDirection = drawDirection;
exports.drawTrack = drawTrack;

var _core = _interopRequireDefault(require("./heatmap/core"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function drawImageScaled(_ref) {
  var img = _ref.img,
      _ref$layers = _ref.layers,
      layers = _ref$layers === void 0 ? [] : _ref$layers,
      layer = _ref.layer,
      canvas = _ref.canvas,
      _ref$options = _ref.options,
      options = _ref$options === void 0 ? {} : _ref$options;
  var ctx = canvas.getContext('2d');

  if (layers.length === 0 && layer) {
    layers = [layer];
  }

  var canvasWidth = Math.max(canvas.offsetWidth, canvas.width);
  var canvasHeight = Math.max(canvas.offsetHeight, canvas.height);
  var actualSize = {
    width: canvasWidth,
    height: canvasHeight
  };

  if (img) {
    var ratio;
    var hRatio = canvasWidth / img.width;
    var vRatio = canvasHeight / img.height;

    if (options.fixedWidth) {
      ratio = hRatio;
    } else if (options.fixedHeight) {
      ratio = vRatio;
    } else {
      ratio = Math.min(hRatio, vRatio);
    }

    actualSize = {
      width: img.width * ratio,
      height: img.height * ratio
    };
  }

  canvas.width = actualSize.width;
  canvas.height = actualSize.height;
  layers.map(function (la, index) {
    if (!la) {
      return;
    }

    ctx.drawImage(la, 0, 0, la.width, la.height, 0, 0, actualSize.width, actualSize.height);
  });
}
/* 画渐变标尺 */


function drawGradient(_ref2) {
  var gradientCfg = _ref2.gradientCfg,
      extrema = _ref2.extrema,
      width = _ref2.width,
      height = _ref2.height,
      _ref2$type = _ref2.type,
      type = _ref2$type === void 0 ? 'maxPercent' : _ref2$type;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  var padding = width * 0.02;
  var paddingL = padding,
      paddingT = padding,
      paddingR = padding,
      paddingB = padding / 4;
  var graW = width * 0.13;
  var graH = height * 0.008;
  var fontSize = width * 0.016;
  var bgW = graW + paddingL + paddingR;
  var bgH = graH + paddingT + paddingB;
  ctx.fillStyle = 'rgba(0,0,0, 0.5)'; // 黑色半透明底色

  ctx.fillRect(width - bgW, height - bgH, bgW, bgH); // 渐变

  var x0 = width - paddingR - graW;
  var y0 = height - paddingB - graH;
  var x1 = width - paddingR;
  var y1 = height - paddingB;
  var gradient = ctx.createLinearGradient(x0, y0, x1, y1);

  for (var key in gradientCfg) {
    gradient.addColorStop(key, gradientCfg[key]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(x0, y0, graW, graH); // 极值

  ctx.font = "normal ".concat(fontSize, "px Microsoft YaHei");
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  var textBottom = height - graH - paddingB * 1.5;
  var _extrema$min = extrema.min,
      min = _extrema$min === void 0 ? 0 : _extrema$min,
      _extrema$max = extrema.max,
      max = _extrema$max === void 0 ? 0 : _extrema$max,
      total = extrema.total;
  var unit = '';
  var fix = 0;
  var minValue = min;
  var middleValue = (min + max) / 2;
  var maxValue = max;

  if (total !== 0 && type === 'maxPercent') {
    unit = '%';
    fix = 1;
    minValue = min / total * 100;
    middleValue = (min + max) / 2 / total * 100;
    maxValue = max / total * 100;
  }

  var fillTexts = [{
    text: minValue.toFixed(fix) + unit,
    x: width - bgW + paddingB,
    y: textBottom
  }, {
    text: middleValue.toFixed(fix) + unit,
    x: width - bgW + graW / 2,
    y: textBottom
  }, {
    text: maxValue.toFixed(fix) + unit,
    x: width - paddingR * 2,
    y: textBottom
  }]; // eslint-disable-next-line array-callback-return

  fillTexts.map(function (item) {
    var text = item.text,
        x = item.x,
        y = item.y;
    ctx.fillText(text, x, y);
  });
  return canvas;
}

function getImageInfo(path) {
  return new Promise(function (resolve, reject) {
    var img = new Image();

    img.onload = function () {
      resolve(img);
    };

    img.onerror = function (e) {
      reject(e);
    };

    img.src = path;
  });
}

function drawHeatmap(_ref3) {
  var points = _ref3.points,
      directionPoints = _ref3.directionPoints,
      path = _ref3.path,
      canvas = _ref3.canvas,
      _ref3$type = _ref3.type,
      type = _ref3$type === void 0 ? 'maxPercent' : _ref3$type,
      _ref3$accuracy = _ref3.accuracy,
      accuracy = _ref3$accuracy === void 0 ? 33 : _ref3$accuracy,
      radius = _ref3.radius,
      _ref3$options = _ref3.options,
      options = _ref3$options === void 0 ? {} : _ref3$options;
  return getImageInfo(path).then(function (img) {
    var width = img.width,
        height = img.height;
    radius = radius || Math.max(width, height) / accuracy;
    points = points.map(function (_ref4) {
      var x = _ref4.x,
          y = _ref4.y,
          value = _ref4.value;
      x = x * width;
      y = y * height;
      return {
        x: x,
        y: y,
        value: value
      };
    });
    var obj = {};
    obj.data = points;

    var heatmapInstance = _core.default.create({
      opacity: 0.6,
      width: width,
      height: height,
      radius: radius
    });

    heatmapInstance.setData(obj);
    return {
      img: img,
      heatmapInstance: heatmapInstance
    };
  }).then(function (_ref5) {
    var img = _ref5.img,
        heatmapInstance = _ref5.heatmapInstance;
    var width = img.width,
        height = img.height;
    var gradientCfg = heatmapInstance.getGradient();
    var extrema = heatmapInstance.getExtremaData();
    var gradientCanvas = drawGradient({
      gradientCfg: gradientCfg,
      extrema: extrema,
      width: width,
      height: height,
      type: type
    });
    var directionCanvas = null;

    if (directionPoints && directionPoints.length > 0) {
      directionCanvas = drawDirection({
        points: directionPoints,
        width: width,
        height: height,
        accuracy: 6,
        filtration: 0.03
      });
    }

    var layers = [img, heatmapInstance.getCanvas(), directionCanvas, gradientCanvas];
    drawImageScaled({
      img: img,
      layers: layers,
      canvas: canvas,
      options: options
    });
    return {
      img: img,
      heatmap: heatmapInstance
    };
  });
} // 坐标为文本基准线中点


function drawText(canvas) {
  var text = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var centerPoint = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [0, 0];

  var _ref6 = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
      _ref6$fontSize = _ref6.fontSize,
      fontSize = _ref6$fontSize === void 0 ? 20 : _ref6$fontSize,
      _ref6$fontFamily = _ref6.fontFamily,
      fontFamily = _ref6$fontFamily === void 0 ? 'PingFangSC-Regular' : _ref6$fontFamily,
      _ref6$color = _ref6.color,
      color = _ref6$color === void 0 ? '#000' : _ref6$color,
      _ref6$usePercent = _ref6.usePercent,
      usePercent = _ref6$usePercent === void 0 ? true : _ref6$usePercent,
      border = _ref6.border;

  var w = canvas.clientWidth,
      h = canvas.clientHeight;

  var _ref7 = usePercent ? getAbsPoint(centerPoint, w, h) : centerPoint,
      _ref8 = _slicedToArray(_ref7, 2),
      x = _ref8[0],
      y = _ref8[1];

  var ctx = canvas.getContext('2d');

  if (border) {
    var _ctx$measureText = ctx.measureText(text),
        width = _ctx$measureText.width;

    drawTextBorder(canvas, [x, y], Object.assign({}, border, {
      textWidth: width,
      fontSize: fontSize,
      usePercent: false
    }));
  }

  ctx.font = "".concat(fontSize, "px ").concat(fontFamily);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawTextBorder(canvas) {
  var textBaseLineCenterPoint = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [0, 0];

  var _ref9 = arguments.length > 2 ? arguments[2] : undefined,
      _ref9$padding = _ref9.padding,
      padding = _ref9$padding === void 0 ? 0 : _ref9$padding,
      radius = _ref9.radius,
      textWidth = _ref9.textWidth,
      width = _ref9.width,
      color = _ref9.color,
      fontSize = _ref9.fontSize,
      backgroundColor = _ref9.backgroundColor,
      usePercent = _ref9.usePercent;

  var _textBaseLineCenterPo = _slicedToArray(textBaseLineCenterPoint, 2),
      x = _textBaseLineCenterPo[0],
      y = _textBaseLineCenterPo[1];

  var paddingL, paddingT;

  if (typeof padding === 'number') {
    paddingL = paddingT = padding;
  } else if (Array.isArray(padding)) {
    paddingT = padding[0];
    paddingL = padding[1];
  }

  var rectWidth = paddingL * 2 + textWidth;
  var rectHeight = paddingT * 2 + fontSize;
  var rectL = x - rectWidth / 2;
  var rectT = y - fontSize - paddingT;
  var leftTopPoint = [rectL, rectT];

  if (radius) {
    drawRoundRect(canvas, leftTopPoint, {
      radius: radius,
      width: rectWidth,
      height: rectHeight,
      lineWidth: width || 1,
      lineColor: color,
      backgroundColor: backgroundColor,
      usePercent: false
    });
  } else {
    drawRect(canvas, leftTopPoint, {
      width: rectWidth,
      height: rectHeight,
      lineWidth: width || 1,
      lineColor: color,
      backgroundColor: backgroundColor,
      usePercent: false
    });
  }
}

function drawPolygon(canvas, points, _ref10) {
  var _ref10$color = _ref10.color,
      color = _ref10$color === void 0 ? 'red' : _ref10$color,
      _ref10$usePercent = _ref10.usePercent,
      usePercent = _ref10$usePercent === void 0 ? true : _ref10$usePercent,
      lineWidth = _ref10.lineWidth,
      backgroundColor = _ref10.backgroundColor;
  var w = canvas.clientWidth,
      h = canvas.clientHeight;
  var l = points.length;
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  var startPoint = usePercent ? getAbsPoint(points[0], w, h) : points[0];
  ctx.moveTo.apply(ctx, _toConsumableArray(startPoint));

  for (var i = 1; i < l; i++) {
    var p = usePercent ? getAbsPoint(points[i], w, h) : points[i];
    ctx.lineTo.apply(ctx, _toConsumableArray(p));
  }

  ctx.lineTo.apply(ctx, _toConsumableArray(startPoint));

  if (lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fill();
  }
}

function drawRoundRect(canvas, leftTopPoint) {
  var _ref11 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      width = _ref11.width,
      height = _ref11.height,
      _ref11$radius = _ref11.radius,
      radius = _ref11$radius === void 0 ? 4 : _ref11$radius,
      lineWidth = _ref11.lineWidth,
      _ref11$lineColor = _ref11.lineColor,
      lineColor = _ref11$lineColor === void 0 ? 'red' : _ref11$lineColor,
      backgroundColor = _ref11.backgroundColor,
      _ref11$usePercent = _ref11.usePercent,
      usePercent = _ref11$usePercent === void 0 ? true : _ref11$usePercent;

  var w = canvas.clientWidth,
      h = canvas.clientHeight;
  var ctx = canvas.getContext('2d');

  var _ref12 = usePercent ? getAbsPoint(leftTopPoint, w, h) : leftTopPoint,
      _ref13 = _slicedToArray(_ref12, 2),
      x = _ref13[0],
      y = _ref13[1];

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.arc(x + width, y + radius, radius, -0.5 * Math.PI, 0);
  ctx.lineTo(x + width + radius, y + radius + height);
  ctx.arc(x + width, y + height + radius, radius, 0, 0.5 * Math.PI);
  ctx.lineTo(x, y + height + 2 * radius);
  ctx.arc(x, y + radius + height, radius, 0.5 * Math.PI, 1 * Math.PI);
  ctx.lineTo(x - radius, y + radius);
  ctx.arc(x, y + radius, radius, 1 * Math.PI, 1.5 * Math.PI);

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fill();
  }

  if (lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
  }
}

function drawRect(canvas, leftTopPoint, _ref14) {
  var width = _ref14.width,
      height = _ref14.height,
      lineWidth = _ref14.lineWidth,
      _ref14$lineColor = _ref14.lineColor,
      lineColor = _ref14$lineColor === void 0 ? 'red' : _ref14$lineColor,
      backgroundColor = _ref14.backgroundColor,
      _ref14$usePercent = _ref14.usePercent,
      usePercent = _ref14$usePercent === void 0 ? true : _ref14$usePercent;
  var clientWidth = canvas.clientWidth,
      clientHeight = canvas.clientHeight;
  var ctx = canvas.getContext('2d');

  var _ref15 = usePercent ? getAbsPoint(leftTopPoint, clientWidth, clientHeight) : leftTopPoint,
      _ref16 = _slicedToArray(_ref15, 2),
      x = _ref16[0],
      y = _ref16[1];

  var w = usePercent ? width * clientWidth : width;
  var h = usePercent ? height * clientHeight : height;

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, w, h);
  }

  if (lineWidth) {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, w, h);
  }
}

function getAbsPoint(point, w, h) {
  return [w * point[0], h * point[1]];
}

function getPointsTotalAndMax(points) {
  var total = 0;
  var maxDirectionValue = 0;
  var maxValue = 0;
  points.map(function (point) {
    // console.log(point[0]*w, point[1]*h)
    var isPointArray = Array.isArray(point),
        value = isPointArray ? 1 : point.value;
    total += value;
    maxDirectionValue = point.max > maxDirectionValue ? point.max : maxDirectionValue;
    maxValue = point.value > maxValue ? point.value : maxValue;
  });
  return {
    total: total,
    maxDirectionValue: maxDirectionValue,
    maxValue: maxValue
  };
}

function canvasArrow(ctx, fromx, fromy, tox, toy, lineWidth) {
  var canvasGradient = ctx.createLinearGradient(fromx, fromy, tox, toy);
  canvasGradient.addColorStop(0, 'rgba(255, 239, 120, 0)');
  canvasGradient.addColorStop(0.5, 'rgba(255, 239, 120, 1)'); //canvasGradient.addColorStop(1, "rgba(255, 239, 120, 1)")

  ctx.strokeStyle = canvasGradient;
  var headlen = lineWidth,
      // length of head in pixels
  angle = Math.atan2(toy - fromy, tox - fromx);
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7)); //path from the side point of the arrow, to the other side point

  ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7), toy - headlen * Math.sin(angle + Math.PI / 7)); //path from the side point back to the tip of the arrow, and then again to the opposite side point

  ctx.lineTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7), toy - headlen * Math.sin(angle - Math.PI / 7));
}

function drawDirection(_ref17) {
  var points = _ref17.points,
      width = _ref17.width,
      height = _ref17.height,
      _ref17$accuracy = _ref17.accuracy,
      accuracy = _ref17$accuracy === void 0 ? 6 : _ref17$accuracy,
      _ref17$filtration = _ref17.filtration,
      filtration = _ref17$filtration === void 0 ? 0.03 : _ref17$filtration;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');

  var _getPointsTotalAndMax = getPointsTotalAndMax(points),
      maxValue = _getPointsTotalAndMax.maxValue;

  var minImgLength = Math.min(width, height);
  var maxLinelength = Math.round(minImgLength / accuracy) / 2;
  var lineWidth = maxLinelength * 0.06;
  ctx.lineWidth = lineWidth;
  points.map(function (point) {
    // value: 一个区域的总人数
    var direction = point.direction,
        x = point.x,
        y = point.y,
        value = point.value,
        max = point.max;
    ctx.beginPath(); // 大于最大值的某个范围才画轨迹线

    if (value / maxValue > filtration) {
      direction.map(function (item) {
        ctx.beginPath();
        var fromx = Math.round(width * x);
        var fromy = Math.round(height * y);
        var label = item.label,
            count = item.count; // 预留顶点坐标周围的空白

        var offset = 0;
        var tox = 0;
        var toy = 0;
        var lineLength = maxLinelength * (count / max); // 后方

        if (label === 0) {
          tox = fromx;
          toy = fromy + offset + lineLength;
          fromy = fromy + offset;
        } // 前方


        if (label === 1) {
          tox = fromx;
          toy = fromy - offset - lineLength;
          fromy = fromy - offset;
        } // 左方


        if (label === 2) {
          tox = fromx - offset - lineLength;
          toy = fromy;
          fromx = fromx - offset;
        } // 右方


        if (label === 3) {
          tox = fromx + offset + lineLength;
          toy = fromy;
          fromx = fromx + offset;
        } // 左后方


        if (label === 4) {
          var pow2 = Math.pow(lineLength, 2);
          var lengthXY = Math.pow(pow2 / 2, 0.5);
          tox = fromx - offset - lengthXY;
          toy = fromy + offset + lengthXY;
          fromx = fromx - offset;
          fromy = fromy + offset;
        } // 左前方


        if (label === 5) {
          var _pow = Math.pow(lineLength, 2);

          var _lengthXY = Math.pow(_pow / 2, 0.5);

          tox = fromx - offset - _lengthXY;
          toy = fromy - offset - _lengthXY;
          fromx = fromx - offset;
          fromy = fromy - offset;
        } // 右后方


        if (label === 6) {
          var _pow2 = Math.pow(lineLength, 2);

          var _lengthXY2 = Math.pow(_pow2 / 2, 0.5);

          tox = fromx + offset + _lengthXY2;
          toy = fromy + offset + _lengthXY2;
          fromx = fromx + offset;
          fromy = fromy + offset;
        } // 右前方


        if (label === 7) {
          var _pow3 = Math.pow(lineLength, 2);

          var _lengthXY3 = Math.pow(_pow3 / 2, 0.5);

          tox = fromx + offset + _lengthXY3;
          toy = fromy - offset - _lengthXY3;
          fromx = fromx + offset;
          fromy = fromy - offset;
        }

        if (tox !== 0 && toy !== 0) {
          canvasArrow(ctx, fromx, fromy, tox, toy, lineWidth);
        }

        ctx.stroke();
      });
    }
  });
  return canvas;
}

function getExtremeValueForTrack(tracks) {
  var maxCount = 0;
  var minCount = 0;
  tracks.map(function (item, i) {
    var count = item.count;
    maxCount = Math.max(count, maxCount);

    if (i === 0) {
      minCount = count;
    } else {
      minCount = Math.min(count, minCount);
    }
  });
  return {
    minCount: minCount,
    maxCount: maxCount
  };
}

function canvasArrowForTrack(ctx, fromx, fromy, tox, toy, maxLineWidth) {
  var headlen = maxLineWidth * 0.2;
  var angle = Math.atan2(toy - fromy, tox - fromx);
  var num = 10;
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / num), toy - headlen * Math.sin(angle - Math.PI / num)); //path from the side point of the arrow, to the other side point

  ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / num), toy - headlen * Math.sin(angle + Math.PI / num)); //path from the side point back to the tip of the arrow, and then again to the opposite side point

  ctx.lineTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / num), toy - headlen * Math.sin(angle - Math.PI / num));
  ctx.fill();
}

function getTrackCanvas(_ref18) {
  var width = _ref18.width,
      height = _ref18.height,
      tracks = _ref18.tracks;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');

  var _getExtremeValueForTr = getExtremeValueForTrack(tracks),
      minCount = _getExtremeValueForTr.minCount,
      maxCount = _getExtremeValueForTr.maxCount;

  var diff = maxCount - minCount;
  var color = 'rgba(255, 239, 120, 0.5)';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  var minImgLength = Math.min(width, height);
  var maxLineWidth = minImgLength * 0.015;
  tracks.map(function (linePoint) {
    ctx.beginPath();
    var count = linePoint.count;
    var lineWidth = (count - minCount) / diff * maxLineWidth + 1;
    ctx.lineWidth = lineWidth;
    var points = linePoint.points || linePoint.walkPoints || [];
    points.map(function (point, index) {
      if (index >= 1) {
        var fromx = Math.round(width * points[index - 1].x);
        var fromy = Math.round(height * points[index - 1].y);
        var tox = Math.round(width * point.x);
        var toy = Math.round(height * point.y);
        canvasArrowForTrack(ctx, fromx, fromy, tox, toy, maxLineWidth);
      }
    });
    ctx.stroke();
  });
  return canvas;
}

function drawTrack(_ref19) {
  var path = _ref19.path,
      tracks = _ref19.tracks,
      canvas = _ref19.canvas;
  return getImageInfo(path).then(function (img) {
    var width = img.width,
        height = img.height;
    var trackCanvas = getTrackCanvas({
      width: width,
      height: height,
      tracks: tracks
    });
    var layers = [img, trackCanvas];
    drawImageScaled({
      img: img,
      layers: layers,
      canvas: canvas
    });
    return {
      img: img
    };
  });
}
},{"./heatmap/core":"heatmap/core.js"}]},{},["index.js"], "tupuCanvasTools")
//# sourceMappingURL=/tupu-canvas-helper.js.map