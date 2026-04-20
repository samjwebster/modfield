export class ConstantModulator {
    constructor(val) {
        this.val = val;
        this.inverted = false;
    }

    mod(d) {
        let m = (d % this.val) / this.val;
        if(this.inverted) m = 1 - m;
        return m;
    }
}

export class FlippingConstantModulator {
    // sort of like a triangle wave
    constructor(val) {
        this.val = val;
        this.inverted = false;
    }

    mod(d) {
        let steps = Math.floor(d / this.val);
        let val = (d % this.val) / this.val;
        if(this.inverted) val = 1 - val;
        return (steps % 2 === 0) ? val : 1 - val;
    }
}

export class FalloffModulator {
    // Idea: modulator changes with distance

    constructor(val, rate) {
        this.val = val;
        this.rate = rate;
        this.inverted = false;
    }

    mod(d) {
        let steps = 1 + (d / this.val);
        let adj_val = this.val * (steps * this.rate);
        let m = (d % adj_val) / adj_val;
        if(this.inverted) m = 1 - m;
        return m;
    }
}

export class BinaryModulator {
    constructor(val) {
        this.val = val;
        this.inverted = false;
    }

    mod(d) {
        let m = Math.floor(d / this.val) % 2;
        if(this.inverted) m = 1 - m;
        return m;
    }
}

export class StepModulator {
    // Quantized stepped levels (discrete bands at distance intervals).
    // Creates banding effect; like concentric rings.
    constructor(stepSize, numSteps) {
        this.stepSize = stepSize;
        this.numSteps = numSteps || 5;
        this.inverted = false;
    }
    mod(d) {
        let step = Math.floor(d / this.stepSize) % this.numSteps;
        let m = step / this.numSteps;
        if(this.inverted) m = 1 - m;
        return m;
    }
}

export class SquareWaveModulator {
    // Hard on/off square wave with adjustable duty cycle.
    // Duty cycle 0.5 is the classic square wave; other values cover pulse-like patterns.
    constructor(period, dutyCycle = 0.5) {
        this.period = period;
        this.dutyCycle = dutyCycle;
        this.inverted = false;
    }
    mod(d) {
        let phase = (d % this.period) / this.period;
        let m = phase < this.dutyCycle ? 1 : 0;
        if(this.inverted) m = 1 - m;
        return m;
    }
}

export class DecayModulator {
    // Efficient monotonic distance decay.
    // Kept as the single decay profile in the library.
    constructor(decayScale) {
        this.decayScale = decayScale;
        this.inverted = false;
    }

    mod(d) {
        let normalized = d / this.decayScale;
        let m = 1 / (1 + normalized);
        if(this.inverted) m = 1 - m;
        return m;
    }
}