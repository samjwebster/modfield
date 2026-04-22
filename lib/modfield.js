
import { aggregateWeightedAvg } from './aggregators.js';

export var warmingSteps = 1000;
export function setWarmingSteps(steps) {
    warmingSteps = steps;
}

export class FieldGroup {
    constructor(fields, aggregator = aggregateWeightedAvg) {
        this.fields = fields;
        this.bounds = fields[0].bounds; // Assume all fields share the same bounds
        this.aggregator = aggregator;

        this.normalize_mode = 'pcts'; // 'minmax' or 'pcts'

        this.minSeen = Infinity;
        this.maxSeen = -Infinity;
        
        this.fifthPct = 0;
        this.ninetyFifthPct = 1; 
        
        this.warm();
    }

    warm() {
        let warm_vals = [];

        if(this.bounds == null) {
            console.log("Cannot warm a FieldGroup with unknown bounds.");
            return;
        }

        for(let i = 0; i < warmingSteps; i++) {
            let x = Math.random() * this.bounds.width;
            let y = Math.random() * this.bounds.height;
            warm_vals.push(this.mod([x, y]));
        }

        let mean = warm_vals.reduce((a, b) => a + b, 0) / warm_vals.length;
        let variance = warm_vals.reduce((a, b) => a + (b - mean) ** 2, 0) / warm_vals.length;
        let stddev = Math.sqrt(variance);

        // Using statistics, calculate the 5th and 95th percentiles to set minSeen and maxSeen
        this.fifthPct = mean - 1.645 * stddev; // Approximation for 5th percentile
        this.ninetyFifthPct = mean + 1.645 * stddev; // Approximation for 95th percentile
    }

    mod(pos) {
        let mods = [];
        let weights = [];
        for(let f of this.fields) {
            mods.push(f.mod(pos));
            weights.push(f.weight);
        }
        let modSum = this.aggregator(mods, weights);
        this.minSeen = Math.min(this.minSeen, modSum);
        this.maxSeen = Math.max(this.maxSeen, modSum);
        return modSum;
    }

    normalize(val) {
        if(this.normalize_mode === 'pcts') {
            return this.normalize_pcts(val);
        } else return this.normalize_minmax(val); // default
    }

    normalize_minmax(val) {
        let range = this.maxSeen - this.minSeen;
        if(!Number.isFinite(range) || range === 0) return 0.5;
        let normalized = (val - this.minSeen) / range;
        if(!Number.isFinite(normalized)) return 0.5;
        return normalized;
    }

    normalize_pcts(val) {
        let range = this.ninetyFifthPct - this.fifthPct;
        if(!Number.isFinite(range) || range === 0) return 0.5;
        let normalized = (val - this.fifthPct) / range;
        if(!Number.isFinite(normalized)) return 0.5;
        return normalized;
    }
}

export class FieldFlipGroup {
    constructor(groupA, groupB, flipField, threshold, aggregator) {
        this.groupA = groupA;
        this.groupB = groupB;
        this.flipField = flipField;
        this.threshold = threshold;
        this.aggregator = aggregator;
    }

    mod(pos) {
        let flipVal = this.flipField.mod(pos);
        let useB = flipVal > this.threshold;

        if(useB) {
            return this.groupB.mod(pos);
        } else {
            return this.groupA.mod(pos);
        }
    }

    normalize(val, useB) {
        if(useB) {
            return this.groupB.normalize(val);
        } else {
            return this.groupA.normalize(val);
        }
    }
}