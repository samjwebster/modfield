
import { aggregateWeightedAvg } from './aggregators.js';

export class FieldGroup {
    constructor(fields, aggregator = aggregateWeightedAvg) {
        this.fields = fields;
        this.aggregator = aggregator;
        this.minSeen = Infinity;
        this.maxSeen = -Infinity;
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
        let range = this.maxSeen - this.minSeen;
        if(!Number.isFinite(range) || range === 0) return 0.5;
        let normalized = (val - this.minSeen) / range;
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