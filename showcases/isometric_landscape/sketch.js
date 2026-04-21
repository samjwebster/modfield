let renderGenerator;
let composition;

function getCanvasDimensions() {
    const container = document.getElementById('canvas_container');
    const nextWidth = Math.max(1, container?.clientWidth || window.innerWidth || 1);
    const nextHeight = Math.max(1, container?.clientHeight || window.innerHeight || 1);
    return { width: nextWidth, height: nextHeight };
}

function setup() {
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent('canvas_container');

    const resetButton = document.getElementById('reset-button');
    resetButton.onclick = regenerate;

    regenerate();
}

function windowResized() {
    const { width: nextWidth, height: nextHeight } = getCanvasDimensions();
    resizeCanvas(nextWidth, nextHeight);
    regenerate();
}

function regenerate() {
    composition = new Composition();
    renderGenerator = composition.render();
    loop();
}

function draw() {
    const nxt = renderGenerator.next();
    if(nxt.done) {
        noLoop();
    }
}

class Composition {
    constructor() {
        this.palette = generateRampPalette();
        this.generate();
    }

    generate() {
        const desiredWidth = 0.0075 * min(width, height);
        const countX = Math.max(8, ceil(width / desiredWidth));
        const cellW = width / countX;

        const desiredHeight = desiredWidth;
        const countY = Math.max(8, ceil(height / desiredHeight));
        const cellH = height / countY;

        this.heightScale = random(0.05, 0.30) * min(width, height);

        this.heightGroup = modfield.generateRandomFieldGroup({
            w: width, h: height,
        });

        this.colorGroup = modfield.generateRandomFieldGroup({
            w: width, h: height,
            modulatorOptions: {
                modAffect: 0.1,
            }
        });

        warmFieldGroup(this.heightGroup, width, height, 30, 30);
        warmFieldGroup(this.colorGroup, width, height, 30, 30);

        this.grid = [];
        for(let i = 0; i < countX; i++) {
            this.grid.push([]);
            const x = i * cellW;
            const tx = countX <= 1 ? 0 : i / (countX - 1);

            for(let j = 0; j < countY; j++) {
                const y = j * cellH;
                const pos = [x + cellW * 0.5, y + cellH * 0.5];
                const ty = countY <= 1 ? 0 : j / (countY - 1);

                const rawHeightVal = sampleNormalized(this.heightGroup, pos);
                const heightVal = constrain(pow(rawHeightVal, 1.35) * 1.08, 0, 1);
                const colorVal = sampleNormalized(this.colorGroup, pos);
                const reliefVal = computeRelief(this.heightGroup, pos, Math.max(cellW, cellH) * 1.15);
                const roofDetail = lerp(heightVal, reliefVal, 1);

                const topGradient = lerpColor(this.palette[4], this.palette[5], tx);
                const bottomGradient = lerpColor(this.palette[2], this.palette[3], ty);
                const districtColor = samplePalette(this.palette, colorVal);

                const terraced = floor(heightVal * 7) / 7;
                const baseHeight = lerp(0.08, 1.0, heightVal) * this.heightScale * lerp(0.9, 1.12, terraced);

                const cell = new Cell(x, y, cellW, cellH, {
                    cTop: topGradient,
                    cBottom: bottomGradient,
                    districtColor,
                    baseHeight,
                    colorMix: colorVal,
                    roofDetail,
                    heightVal,
                    reliefVal,
                    heightGroup: this.heightGroup,
                    colorGroup: this.colorGroup
                });

                cell.computeUpperCorners();
                this.grid[i].push(cell);
            }
        }
    }

    *render() {
        // this.renderDebug();
        // return;

        background(120);
        const skyTop = color(14, 24, 38);
        const skyBottom = color(72, 86, 104);
        verticalGradient(0, 0, width, height, skyTop, skyBottom);
        yield;

        const skipper = 10;
        for(let row = 0; row < this.grid[0].length; row++) {
            for(let col = 0; col < this.grid.length; col++) {
                const cell = this.grid[col][row];
                if(cell.onScreen()) {
                    cell.render();
                }
            }

            if(row % skipper === 0) {
                yield;
            }
        }
    }

    renderDebug() {
        background(120);
        // draw the normal grid instead of pseudo3d isometric
        for(let row = 0; row < this.grid[0].length; row++) {
            for(let col = 0; col < this.grid.length; col++) {
                const cell = this.grid[col][row];
                fill(cell.districtColor);
                rect(cell.x, cell.y, cell.w, cell.h);
            }   
        }
    }
}

function cartToIso(x, y) {
    const isoX = x - y;
    const isoY = (x + y) * 0.5;
    return [isoX, isoY];
}

class Cell {
    constructor(x, y, w, h, options) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.cTop = options.cTop;
        this.cBottom = options.cBottom;
        this.districtColor = options.districtColor;
        this.baseHeight = options.baseHeight;
        this.colorMix = options.colorMix;
        this.roofDetail = options.roofDetail;
        this.heightVal = options.heightVal;
        this.reliefVal = options.reliefVal;
        this.heightGroup = options.heightGroup;
        this.colorGroup = options.colorGroup;

        this.corners = [
            [this.x, this.y],
            [this.x + this.w, this.y],
            [this.x + this.w, this.y + this.h],
            [this.x, this.y + this.h]
        ];

        this.corners_iso = this.corners.map((corner) => {
            const iso = cartToIso(corner[0], corner[1]);
            iso[0] += width * 0.5;
            iso[0] = map(iso[0], 0, width, -0.8 * width, width * 1.8);
            iso[1] = map(iso[1], 0, height, -0.8 * height, height * 1.8);
            return iso;
        });

        this.corners_upper_iso = [];
    }

    computeUpperCorners() {
        const center = [
            this.x + this.w * 0.5,
            this.y + this.h * 0.5
        ];

        const roofHeightScale = lerp(0.85, 1.15, this.roofDetail);

        this.corners_upper_iso = this.corners.map((corner, idx) => {
            const blendPoint = lerpPos(corner, center, 0.32);
            const hDetail = sampleNormalized(this.heightGroup, blendPoint);
            const cDetail = sampleNormalized(this.colorGroup, [blendPoint[0] + this.w * 0.2, blendPoint[1] - this.h * 0.2]);
            const detail = lerp(hDetail, cDetail, 0.45);
            const cornerJitter = lerp(-0.12, 0.12, detail) * this.baseHeight;
            const edgeBias = idx < 2 ? 0.04 : -0.04;
            const cornerHeight = Math.max(0, (this.baseHeight * roofHeightScale) + cornerJitter + (edgeBias * this.baseHeight));
            return [
                this.corners_iso[idx][0],
                this.corners_iso[idx][1] - cornerHeight
            ];
        });
    }

    onScreen() {
        for(const point of this.corners_iso) {
            if(point[0] >= -0.25 * width && point[0] <= 1.25 * width && point[1] >= -0.25 * height && point[1] <= 1.25 * height) {
                return true;
            }
        }

        for(const point of this.corners_upper_iso) {
            if(point[0] >= -0.25 * width && point[0] <= 1.25 * width && point[1] >= -0.25 * height && point[1] <= 1.25 * height) {
                return true;
            }
        }

        return false;
    }

    render() {
        const mixT = constrain((this.colorMix * 0.9) + (this.heightVal * 0.1), 0, 1);
        const mainBlend = lerpColor(this.cTop, this.cBottom, mixT);
        const colMainBase = lerpColor(this.districtColor, mainBlend, 0.54);
        const reliefGlow = lerpColor(colMainBase, color(255, 236, 190), constrain(0.06 + (this.reliefVal * 0.34), 0, 0.4));
        const colMain = lerpColor(reliefGlow, color(20, 24, 36), constrain((1 - this.heightVal) * 0.16, 0, 0.2));
        const colLight = lerpColor(colMain, color(255), 0.16 + (this.reliefVal * 0.1));
        const colDark = lerpColor(colMain, color(0), 0.14 + ((1 - this.heightVal) * 0.08));
        const colDarker = lerpColor(colMain, color(0), 0.30 + ((1 - this.heightVal) * 0.1));
        const colDarkest = lerpColor(colMain, color(0), 0.44 + ((1 - this.heightVal) * 0.08));

        fill(colLight);
        stroke(colMain);
        beginShape();
        for(const vertexPos of this.corners_upper_iso) {
            vertex(vertexPos[0], vertexPos[1]);
        }
        endShape(CLOSE);

        const contourStroke = color(255);
        contourStroke.setAlpha(18 + (this.reliefVal * 90));
        push();
        noFill();
        stroke(contourStroke);
        beginShape();
        for(const vertexPos of this.corners_upper_iso) {
            vertex(vertexPos[0], vertexPos[1]);
        }
        endShape(CLOSE);
        pop();

        gradFill(
            [0, max(this.corners_upper_iso[2][1], this.corners_upper_iso[3][1])],
            [0, min(this.corners_iso[2][1], this.corners_iso[3][1])],
            colMain,
            colDark
        );
        stroke(colDarker);
        beginShape();
        vertex(...this.corners_iso[2]);
        vertex(...this.corners_upper_iso[2]);
        vertex(...this.corners_upper_iso[3]);
        vertex(...this.corners_iso[3]);
        endShape(CLOSE);

        gradFill(
            [0, max(this.corners_upper_iso[1][1], this.corners_upper_iso[2][1])],
            [0, min(this.corners_iso[1][1], this.corners_iso[2][1])],
            colDark,
            colDarker
        );
        stroke(colDarkest);
        beginShape();
        vertex(...this.corners_iso[1]);
        vertex(...this.corners_upper_iso[1]);
        vertex(...this.corners_upper_iso[2]);
        vertex(...this.corners_iso[2]);
        endShape(CLOSE);
    }
}

function clamp(value, minValue, maxValue) {
    return Math.min(maxValue, Math.max(minValue, value));
}

function normalizeRampColor(colorValue) {
    if(!colorValue) {
        return null;
    }

    let h;
    let s;
    let l;

    if(Array.isArray(colorValue)) {
        [h, s, l] = colorValue;
    } else {
        h = colorValue.h;
        s = colorValue.s;
        l = colorValue.l;
    }

    if(!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
        return null;
    }

    const sat = s > 1 ? s : s * 100;
    const lig = l > 1 ? l : l * 100;

    return {
        h: ((h % 360) + 360) % 360,
        s: clamp(sat, 0, 100),
        l: clamp(lig, 0, 100)
    };
}

function generateRampPalette() {
    let sGap = random(0.20, 0.40);
    let sStart = random(0.20, 0.30);
    let sRange = [sStart, sStart + sGap];

    let lRange = [0.3 * random(), 0.9];

    let palette = rampensau.generateColorRamp({
        total: 12,
        hStart: random() * 360,
        hCycles: 1,
        hStartCenter: 0.5,
        // hueList: hueList,
        sRange: sRange,
        lRange: lRange,
    });

    colorMode(HSB, 360, 100, 100, 255);
    palette = palette.map((c) => color(c[0], c[1] * 100, c[2] * 100, 255));
    colorMode(RGB, 255, 255, 255, 255);

    if(random() < 0.5) {
        palette.reverse();
    }

    return palette;
}

function warmFieldGroup(group, maxX, maxY, stepsX, stepsY) {
    for(let xi = 0; xi < stepsX; xi++) {
        const x = (xi / Math.max(stepsX - 1, 1)) * maxX;
        for(let yi = 0; yi < stepsY; yi++) {
            const y = (yi / Math.max(stepsY - 1, 1)) * maxY;
            group.mod([x, y]);
        }
    }
}

function sampleNormalized(group, pos) {
    pos = [pos[0], pos[1]];
    const value = group.mod(pos);
    return group.normalize(value);
}

function computeRelief(group, pos, offset) {
    const h0 = sampleNormalized(group, pos);
    const hx = sampleNormalized(group, [pos[0] + offset, pos[1]]);
    const hy = sampleNormalized(group, [pos[0], pos[1] + offset]);
    const gradient = abs(hx - h0) + abs(hy - h0);
    return constrain(gradient * 2.2, 0, 1);
}

function samplePalette(palette, t) {
    const n = palette.length;
    if(n === 0) {
        return color('#808080');
    }
    if(n === 1) {
        return palette[0];
    }

    const mapped = constrain(t, 0, 0.99999) * (n - 1);
    const index = floor(mapped);
    const localT = mapped - index;

    const a = palette[index];
    const b = palette[Math.min(index + 1, n - 1)];
    return lerpColor(a, b, localT);
}

function toP5Palette(hexPalette) {
    return hexPalette.map((hex) => color(hex));
}

function lerpPos(a, b, t) {
    return [
        lerp(a[0], b[0], t),
        lerp(a[1], b[1], t)
    ];
}

function verticalGradient(x, y, w, h, cTop, cBottom) {
    noFill();
    for(let i = 0; i <= h; i++) {
        const t = i / Math.max(h, 1);
        stroke(lerpColor(cTop, cBottom, t));
        line(x, y + i, x + w, y + i);
    }
}

function gradFill(startPos, endPos, c1, c2) {
    const c1Opaque = color(red(c1), green(c1), blue(c1), 255);
    const c2Opaque = color(red(c2), green(c2), blue(c2), 255);
    // Ensure shape fill is enabled after any previous noFill() calls.
    fill(255);
    const grad = drawingContext.createLinearGradient(startPos[0], startPos[1], endPos[0], endPos[1]);
    grad.addColorStop(0, c1Opaque.toString());
    grad.addColorStop(1, c2Opaque.toString());
    drawingContext.fillStyle = grad;
}
