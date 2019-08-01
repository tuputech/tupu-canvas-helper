Tupu-canvas-helper
==================================================

如何使用
--------------------------------------

1.  引入资源

```javascript
<script type="text/javascript" src="./tupu-canvas-helper.min.js"></script>
//测试数据
<script type="text/javascript" src="./data.js"></script>
```

若浏览器不支持Promise则需要引入[promise-polyfill](https://www.npmjs.com/package/promise-polyfill)

2. 新建canvas标签

```html
<body>
...
<!-- width和height不要写到style -->
<canvas width="950" height="560" id="canvasTest" />
...
</body>
```

3. 调用相关api

```javascript
    const data = window.canvanTestData
    const { drawHeatmap, drawPolygon, drawText } = tupuCanvasTools
    const { points, domains, snapshot, layoutMappings } = data
    const canvas = document.getElementById('canvasTest')
    const path = domains.original + snapshot

    function getPolygonExtreamPoints(positions) {
        if (!positions || !positions.length) {
            return null
        }
        let l = 1,
            r = 0,
            t = 1,
            b = 0
        positions.map(([x, y]) => {
            if (x < l) {
                l = x
            }
            if (x > r) {
                r = x
            }
            if (y < t) {
                t = y
            }
            if (y > b) {
                b = y
            }
        })
        return { l, r, t, b }
    }

    function drawLayoutMappings(canvas, mappings) {
        const { CIDs } = data
        CIDs.map((CID) => {
            const camName = CID

            mappings[CID] && mappings[CID].map(({ layoutPoints, name }) => {
                const extreamPoints = getPolygonExtreamPoints(layoutPoints)
                const centerX = (extreamPoints.l + extreamPoints.r) / 2
                const centerY = (extreamPoints.t + extreamPoints.b) / 2
                drawPolygon(canvas, layoutPoints, { color: '#EB4734', lineWidth: 2 })
                drawText(canvas, name || camName, [centerX, centerY], {
                    fontSize: 12,
                    color: '#666',
                    border: {
                        padding: [4, 8],
                        radius: 4,
                        width: 2,
                        color: '#F94236',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                    },
                })
            })
        })
    }

    drawHeatmap({
        points,
        path,
        canvas,
        radius: 20, //热力点的半径
    }).then(() => {
        drawLayoutMappings(canvas, layoutMappings)
    })
```
