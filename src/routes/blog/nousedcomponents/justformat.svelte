<script>
    /* 
        Set up the num of squares etc
    */

    let dataConfig = {
        nRects: 20,
        nSizes: 20,
        maxAspect: 3,
    };
    let { nRects = 20, nSizes, maxAspect = 3 } = dataConfig;
    let sizeSet = new Set();
    let sizes = [];
    let maxArea = (400 * 0.9) ** 2 / nRects;
    let minArea = 16;
    for (let i = Math.min(nRects, nSizes); i > 0; i--) {
        let area, aspect, key;
        do {
            area = ~~(Math.random() * (maxArea - minArea) + minArea);
            aspect = Math.random() * (maxAspect - 1) + 1;
            if (Math.random() < 0.5) aspect = 1 / aspect; // Flip vertical/horizontal aspect ratio
            key = area + "," + aspect;
        } while (sizeSet.has(key));
        sizes.push([area, aspect]);
        sizeSet.add(key);
    }
    let rects = [];
    for (let i = 0; i < nRects; i++) {
        rects.push(sizes[~~(Math.random() * sizes.length)]);
    }
    rects.sort((a, b) => b[0] - a[0]);
</script>
