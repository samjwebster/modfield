import { dist, TAU, radians, random } from './utils.js';

export class CircleField {
    constructor(pos, modulator) {
        this.pos = pos;
        this.modulator = modulator;
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        return dist(...this.pos, ...pos);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        let m = this.modulator.mod(d);
        return m;
    }
}

export class LineField {
    constructor(pos, slope, modulator) {
        this.pos = pos;
        this.slope = slope;
        this.modulator = modulator;
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        // Distance from point to line
        let [x0, y0] = pos;
        let [x1, y1] = this.pos;
        let m = this.slope;
        let A = m;
        let B = -1;
        let C = y1 - m * x1;
        return Math.abs(A * x0 + B * y0 + C) / Math.sqrt(A * A + B * B);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        let m = this.modulator.mod(d);
        return m;
    }
}

export class SegmentField {
    constructor(posA, posB, modulator) {
        this.posA = posA;
        this.posB = posB;
        this.modulator = modulator;
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        // Distance from point to line segment
        let [x0, y0] = pos;
        let [x1, y1] = this.posA;
        let [x2, y2] = this.posB;
        let A = x0 - x1;
        let B = y0 - y1;
        let C = x2 - x1;
        let D = y2 - y1;
        let dot = A * C + B * D;
        let len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) param = dot / len_sq;
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        }
        else if (param > 1) {
            xx = x2;
            yy = y2;
        }
        else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        return dist(x0, y0, xx, yy);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        let m = this.modulator.mod(d);
        return m;
    }
}


export class RectField {
    constructor(pos, w, h, modulator) {
        this.pos = pos;
        this.w = w;
        this.h = h;
        this.modulator = modulator;
        this.weight = 1;
        this.bounds = null;
    }
    
    dist(pos) {
        let [x0, y0] = pos;
        let [x1, y1] = this.pos;
        let dx = Math.max(Math.abs(x0 - x1) - this.w / 2, 0);
        let dy = Math.max(Math.abs(y0 - y1) - this.h / 2, 0);
        return Math.sqrt(dx * dx + dy * dy);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        let m = this.modulator.mod(d);
        return m;
    }
}

export class OvalField {
    constructor(pos, w, h, modulator) {
        this.pos = pos;
        this.w = w;
        this.h = h;
        this.modulator = modulator;
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        let [x0, y0] = pos;
        let [x1, y1] = this.pos;
        let dx = x0 - x1;
        let dy = y0 - y1;
        return Math.sqrt((dx * dx) / (this.w * this.w) + (dy * dy) / (this.h * this.h)) * Math.min(this.w, this.h);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        let m = this.modulator.mod(d);
        return m;
    }
}

export class SineField {
    constructor(pos, freq, angle, amplitude, modulator) {
        this.pos = pos;
        this.freq = freq;
        // Treat small magnitudes as radians (p5 TAU-style); larger values as degrees.
        this.angle = Math.abs(angle) <= TAU ? angle : radians(angle);
        this.cosAngle = Math.cos(this.angle);
        this.sinAngle = Math.sin(this.angle);
        this.amplitude = amplitude;
        this.modulator = modulator;
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        // Distance from pos to the sine wave, which has an origin of this.pos, a frequency of this.freq, and an angle of this.angle
        let [x0, y0] = pos;
        let [x1, y1] = this.pos;
        let dx = x0 - x1;
        let dy = y0 - y1;
        // Rotate query point into the sine field's local frame.
        let rotatedX = dx * this.cosAngle + dy * this.sinAngle;
        let rotatedY = -dx * this.sinAngle + dy * this.cosAngle;
        let sineY = Math.sin(rotatedX * this.freq) * this.amplitude;
        return Math.abs(rotatedY - sineY);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        let m = this.modulator.mod(d);
        return m;
    }
}

export class VortexField {
    // A spiral sink/source field: distance is measured along a rotating spiral arm.
    // Could create shell-like bands and whirlpool patterns.
    constructor(pos, turnRate, modulator, scale = 100) {
        this.pos = pos;
        this.turnRate = turnRate;
        this.modulator = modulator;
        this.scale = scale; // replaces min(width, height)
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        let [x0, y0] = pos;
        let [x1, y1] = this.pos;
        let dx = x0 - x1;
        let dy = y0 - y1;
        let radius = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);

        // Map angle onto a spiral radius so the field behaves like a rotating arm.
        let spiralRadius = ((angle + Math.PI) / TAU) * this.turnRate * this.scale;
        return Math.abs(radius - spiralRadius);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        return this.modulator.mod(d);
    }
}

export class RadialField {
    // Distance is based on expanding ripples from a center with optional directional wobble.
    // Feels like water waves or dropped-stone interference.
    constructor(pos, waveSpacing, wobble, modulator) {
        this.pos = pos;
        this.waveSpacing = waveSpacing;
        this.wobble = wobble;
        this.modulator = modulator;
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        let [x0, y0] = pos;
        let [x1, y1] = this.pos;
        let dx = x0 - x1;
        let dy = y0 - y1;
        let radius = Math.sqrt(dx * dx + dy * dy);
            let bandPhase = radius / Math.max(this.waveSpacing, 0.0001);
            let bandValue = Math.abs((bandPhase % 1) - 0.5) * 2;
        let wobbleAmt = Math.abs(Math.sin(Math.atan2(dy, dx) * 3.0)) * this.wobble;
            return Math.abs(bandValue + wobbleAmt);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        return this.modulator.mod(d);
    }
}

export class CrossField {
    // Measures distance to mirrored versions of the point across one or more axes.
    // Good for kaleidoscope-like symmetry without explicitly drawing symmetry.
    constructor(pos, axisAngle, modulator) {
        this.pos = pos;
        this.axisAngle = axisAngle;
        this.modulator = modulator;
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        let [x0, y0] = pos;
        let [x1, y1] = this.pos;
        let dx = x0 - x1;
        let dy = y0 - y1;

        let angleRad = this.axisAngle;
        let c = Math.cos(angleRad);
        let s = Math.sin(angleRad);

        let localX = dx * c + dy * s;
        let localY = -dx * s + dy * c;

        // Symmetry around the axis and its mirror-perpendicular counterpart.
        let axisDist = Math.abs(localY);
        let mirrorDist = Math.abs(localX);
        return Math.min(axisDist, mirrorDist);
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        return this.modulator.mod(d);
    }
}

export class CellularField {
    // Uses a seed lattice and nearest-seed distance with irregular jitter.
    // More like weird cells or foam than geometric fields.
    constructor(seedPoints, modulator, scale = 100) {
        this.seedPoints = seedPoints;
        this.seedRadii = seedPoints.map(() => random(0.5, 1.5) * scale * 0.1);
        this.modulator = modulator;
        this.scale = scale; // replaces min(width, height)
        this.weight = 1;
        this.bounds = null;
    }

    dist(pos) {
        let minDist = Infinity;
        for(let i = 0; i < this.seedPoints.length; i++) {
            let seed = this.seedPoints[i];
            let radius = this.seedRadii[i];
            let jitter = 0.15 * this.scale * Math.sin(i * 12.9898 + seed[0] * 0.01 + seed[1] * 0.02);
            let sx = seed[0] + jitter * 0.25;
            let sy = seed[1] + jitter * 0.25;
            let boundaryDist = Math.abs(dist(pos[0], pos[1], sx, sy) - radius);
            minDist = Math.min(minDist, boundaryDist);
        }
        return minDist;
    }

    mod(pos, rnd = true) {
        let d = rnd ? Math.round(this.dist(pos)) : this.dist(pos);
        return this.modulator.mod(d);
    }
}