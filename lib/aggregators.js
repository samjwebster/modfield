import { random } from './utils.js';

export function aggregateWeightedAvg(vals, weights) {
    let sum = 0;
    let weightSum = 0;
    for(let i = 0; i < vals.length; i++) {
        sum += vals[i] * weights[i];
        weightSum += weights[i];
    }
    return sum / weightSum;
}

export function aggregateMin(vals, weights) {
    vals = vals.map((v, i) => v * (weights[i] ?? 1));
    return Math.min(...vals);
}

export function aggregateMax(vals, weights) {
    vals = vals.map((v, i) => v * (weights[i] ?? 1));
    return Math.max(...vals);
}

export function aggregateWeightedRandom(vals, weights) {
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let target = random(totalWeight);
    let cumulative = 0;
    for(let i = 0; i < vals.length; i++) {
        cumulative += weights[i];
        if(cumulative >= target) return vals[i];
    }
    return random(vals);
}

export function aggregateWeightedMedian(vals, weights) {
    // Median instead of mean; less influenced by extremes.
    // Creates more stable, less spiky patterns.
    let pairs = vals.map((v, i) => ({val: v, weight: weights[i]}));
    pairs.sort((a, b) => a.val - b.val);
    let cumWeight = 0;
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    for(let pair of pairs) {
        cumWeight += pair.weight;
        if(cumWeight >= totalWeight / 2) return pair.val;
    }
    return pairs[pairs.length - 1].val;
}

export function aggregateAlternating(vals, weights) {
    // Split fields by index parity, but only average the even-indexed (0,2,4,...) values.
    // Odd-indexed fields contribute only to normalization, which creates a pulsing, rhythmic bias.
    let odd = 0, evenSum = 0;
    for(let i = 0; i < vals.length; i++) {
        if(i % 2 === 0) odd += vals[i] * weights[i];
        else evenSum += weights[i];
    }
    return evenSum > 0 ? odd / evenSum : Math.min(...vals);
}

export function aggregateWeightedStdDev(vals, weights) {
    // Weighted standard deviation: spread of field values.
    // High stdDev = high divergence, creates texture from disagreement.
    let avg = aggregateWeightedAvg(vals, weights);
    let sum = 0, weightSum = 0;
    for(let i = 0; i < vals.length; i++) {
        sum += weights[i] * (vals[i] - avg) ** 2;
        weightSum += weights[i];
    }
    return Math.sqrt(sum / weightSum);
}

export function aggregateSpread(vals, weights) {
    // Return how far the values spread apart instead of combining them.
    // Great when you want 'conflict' between fields to show up.
    if(vals.length === 0) return 0;

    vals = vals.map((v, i) => v * (weights[i] ?? 1));

    return Math.max(...vals) - Math.min(...vals);
}