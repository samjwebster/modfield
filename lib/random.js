import { random, TAU } from './utils.js';
import {
    aggregateWeightedAvg,
    aggregateMin,
    aggregateMax,
    aggregateWeightedRandom,
    aggregateWeightedMedian,
    aggregateAlternating,
    aggregateWeightedStdDev,
    aggregateSpread
} from './aggregators.js';
import {
    CircleField,
    LineField,
    SegmentField,
    RectField,
    OvalField,
    SineField,
    VortexField,
    RadialField,
    CrossField,
    CellularField
} from './fields.js';
import { FieldGroup, FieldFlipGroup } from './modfield.js';
import {
    ConstantModulator,
    FlippingConstantModulator,
    FalloffModulator,
    BinaryModulator,
    DecayModulator,
    StepModulator,
    SquareWaveModulator
} from './modulators.js';

export const DEFAULT_AGGREGATOR_WEIGHTS = {
    aggregateWeightedAvg: 1.4,
    aggregateWeightedMedian: 0.6,
    aggregateSpread: 0.4,
    aggregateMin: 0.3,
    aggregateMax: 0.3,
    aggregateWeightedRandom: 0.2,
    aggregateAlternating: 0.25,
    aggregateWeightedStdDev: 0.15
};

export const DEFAULT_MODULATOR_WEIGHTS = {
    constant: 1.2,
    flippingConstant: 0.66,
    falloff: 0.75,
    binary: 0.2,
    decay: 0.2,
    step: 0.33,
    squareWave: 0.25
};

export const DEFAULT_FIELD_WEIGHTS = {
    line: 1,
    segment: 1,
    circle: 1,
    oval: 1,
    rect: 1,
    sine: 1,
    vortex: 1,
    radial: 1,
    mirror: 1,
    cellular: 1
};

const MODULATOR_ALIASES = {
    1: 'constant',
    2: 'flippingConstant',
    3: 'falloff',
    4: 'binary',
    5: 'decay',
    6: 'step',
    7: 'squareWave'
};

const FIELD_ALIASES = {
    1: 'line',
    2: 'segment',
    3: 'circle',
    4: 'oval',
    5: 'rect',
    6: 'sine',
    7: 'vortex',
    8: 'radial',
    9: 'mirror',
    10: 'cellular'
};

const AGGREGATOR_FACTORIES = {
    aggregateWeightedAvg,
    aggregateMin,
    aggregateMax,
    aggregateWeightedRandom,
    aggregateWeightedMedian,
    aggregateAlternating,
    aggregateWeightedStdDev,
    aggregateSpread
};

const MODULATOR_FACTORIES = {
    constant: (value) => new ConstantModulator(value),
    flippingConstant: (value) => new FlippingConstantModulator(value),
    falloff: (value, options) => new FalloffModulator(value, options.rate),
    binary: (value) => new BinaryModulator(value),
    decay: (value) => new DecayModulator(value),
    step: (value, options) => new StepModulator(value, options.numSteps),
    squareWave: (value, options) => new SquareWaveModulator(value, options.dutyCycle)
};

const FIELD_FACTORIES = {
    line: (position, options) => new LineField(position, options.slope, options.modulator),
    segment: (position, options) => new SegmentField(position, options.endPosition, options.modulator),
    circle: (position, options) => new CircleField(position, options.modulator),
    oval: (position, options) => new OvalField(position, options.width, options.height, options.modulator),
    rect: (position, options) => new RectField(position, options.width, options.height, options.modulator),
    sine: (position, options) => new SineField(position, options.frequency, options.angle, options.amplitude, options.modulator),
    vortex: (position, options) => new VortexField(position, options.turnRate, options.modulator, options.scale),
    radial: (position, options) => new RadialField(position, options.waveSpacing, options.wobble, options.modulator),
    mirror: (position, options) => new CrossField(position, options.axisAngle, options.modulator),
    cellular: (_position, options) => new CellularField(options.seedPoints, options.modulator, options.scale)
};

function resolveType(type, aliases) {
    if(type == null) return null;
    return aliases[type] ?? type;
}

function weightedChoice(weights, choices) {
    const entries = choices.map((choice) => ({
        choice,
        weight: weights[choice] ?? 1
    }));
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if(totalWeight <= 0) {
        return choices[0];
    }

    let threshold = random() * totalWeight;
    for(const entry of entries) {
        threshold -= entry.weight;
        if(threshold <= 0) {
            return entry.choice;
        }
    }

    return choices[choices.length - 1];
}

function resolveAggregatorType(type, aliases) {
    if(type == null) return null;
    return aliases[type] ?? type;
}

function generateRandomAggregator(options = {}) {
    const {
        aggregatorType = null,
        aggregatorTypes = Object.keys(DEFAULT_AGGREGATOR_WEIGHTS),
        aggregatorWeights = DEFAULT_AGGREGATOR_WEIGHTS
    } = options;

    const typeChoices = aggregatorTypes.map((choice) => resolveAggregatorType(choice, AGGREGATOR_FACTORIES));
    const resolvedType = resolveAggregatorType(aggregatorType, AGGREGATOR_FACTORIES) ?? weightedChoice(aggregatorWeights, typeChoices);
    return AGGREGATOR_FACTORIES[resolvedType] ?? aggregateWeightedAvg;
}

function createPosition(bounds, outsideChance = 0.25, outsideRange = [[-3, -0.5], [1.5, 3]]) {
    const maxDim = Math.max(bounds.width, bounds.height);
    let position = [random(bounds.width), random(bounds.height)];

    if(random() < outsideChance) {
        const xScale = random(outsideRange[0][0], outsideRange[0][1]);
        const yScale = random(outsideRange[1][0], outsideRange[1][1]);
        position = [
            random([xScale * maxDim, random(1.5, 3) * maxDim]),
            random([yScale * maxDim, random(1.5, 3) * maxDim])
        ];
    }

    return position;
}

function createSeedPoints(bounds, count) {
    const seedPoints = [];
    for(let index = 0; index < count; index += 1) {
        seedPoints.push([random(bounds.width), random(bounds.height)]);
    }
    return seedPoints;
}

export function generateRandomModulator(options = {}) {
    const {
        modulatorType = null,
        modulatorTypes = Object.keys(DEFAULT_MODULATOR_WEIGHTS),
        modulatorWeights = DEFAULT_MODULATOR_WEIGHTS,
        size = 100,
        modAffect = 1,
        invertChance = 0.5,
        valueMode = 'bimodal',
        smallValueRange = [0.0025, 0.0075],
        largeValueRange = [0.25, 1.75],
        valueChance = 0.5,
        rateRange = [0.01, 0.05],
        numStepsChoices = [3, 4, 5, 6],
        dutyCycleRange = [0.35, 0.7]
    } = options;

    const typeChoices = modulatorTypes.map((choice) => resolveType(choice, MODULATOR_ALIASES));
    const resolvedType = resolveType(modulatorType, MODULATOR_ALIASES) ?? weightedChoice(modulatorWeights, typeChoices);
    const rawValue = valueMode === 'uniform'
        ? random(smallValueRange[0], largeValueRange[1])
        : (random() < valueChance ? random(smallValueRange[0], smallValueRange[1]) : random(largeValueRange[0], largeValueRange[1]));
    const modValue = Math.round(rawValue * modAffect * size);

    let modulator;
    if(resolvedType === 'falloff') {
        modulator = MODULATOR_FACTORIES.falloff(modValue, { rate: random(rateRange[0], rateRange[1]) });
    } else if(resolvedType === 'step') {
        modulator = MODULATOR_FACTORIES.step(modValue, { numSteps: random(numStepsChoices) });
    } else if(resolvedType === 'squareWave') {
        modulator = MODULATOR_FACTORIES.squareWave(modValue, { dutyCycle: random(dutyCycleRange[0], dutyCycleRange[1]) });
    } else {
        const factory = MODULATOR_FACTORIES[resolvedType] ?? MODULATOR_FACTORIES.constant;
        modulator = factory(modValue);
    }

    modulator.inverted = random() < invertChance;
    return modulator;
}

export function generateRandomField(options = {}) {
    const {
        fieldType = null,
        fieldTypes = Object.keys(DEFAULT_FIELD_WEIGHTS),
        fieldWeights = DEFAULT_FIELD_WEIGHTS,
        bounds = { width: 1000, height: 1000 },
        modulatorOptions = {},
        modulator = null,
        outsideChance = 0.25,
        outsideRange = [[-3, -0.5], [1.5, 3]],
        weightRange = [0, 1],
        lineSlopeRange = [-TAU, TAU],
        widthRange = [0.1, 0.25],
        heightRange = [0.1, 0.25],
        sineFrequencyRange = [0.0075, 0.0125],
        sineAmplitudeRange = [0.25, 0.5],
        vortexTurnRateRange = [0.05, 3.0],
        radialSpacingRange = [0.0125, 0.075],
        radialWobbleRange = [0, 0.1],
        cellularSeedCountRange = [3, 10],
        scale = Math.min(bounds.width, bounds.height)
    } = options;

    const typeChoices = fieldTypes.map((choice) => resolveType(choice, FIELD_ALIASES));
    const resolvedType = resolveType(fieldType, FIELD_ALIASES) ?? weightedChoice(fieldWeights, typeChoices);
    const position = options.position ?? createPosition(bounds, outsideChance, outsideRange);
    const fieldModulator = modulator ?? generateRandomModulator({ size: scale, ...modulatorOptions });
    const fieldOptions = { modulator: fieldModulator, scale };

    let field;
    if(resolvedType === 'line') {
        field = FIELD_FACTORIES.line(position, {
            ...fieldOptions,
            slope: random(lineSlopeRange[0], lineSlopeRange[1])
        });
    } else if(resolvedType === 'segment') {
        field = FIELD_FACTORIES.segment(position, {
            ...fieldOptions,
            endPosition: [random(bounds.width), random(bounds.height)]
        });
    } else if(resolvedType === 'circle') {
        field = FIELD_FACTORIES.circle(position, fieldOptions);
    } else if(resolvedType === 'oval' || resolvedType === 'rect') {
        const width = random(widthRange[0], widthRange[1]) * scale;
        const height = random(heightRange[0], heightRange[1]) * scale;
        field = FIELD_FACTORIES[resolvedType](position, {
            ...fieldOptions,
            width,
            height
        });
    } else if(resolvedType === 'sine') {
        field = FIELD_FACTORIES.sine(position, {
            ...fieldOptions,
            frequency: random(sineFrequencyRange[0], sineFrequencyRange[1]),
            angle: random() * TAU,
            amplitude: random(sineAmplitudeRange[0], sineAmplitudeRange[1]) * scale
        });
    } else if(resolvedType === 'vortex') {
        field = FIELD_FACTORIES.vortex(position, {
            ...fieldOptions,
            turnRate: random(vortexTurnRateRange[0], vortexTurnRateRange[1])
        });
    } else if(resolvedType === 'radial') {
        field = FIELD_FACTORIES.radial(position, {
            ...fieldOptions,
            waveSpacing: random(radialSpacingRange[0], radialSpacingRange[1]) * scale,
            wobble: random(radialWobbleRange[0], radialWobbleRange[1]) * scale
        });
    } else if(resolvedType === 'mirror') {
        field = FIELD_FACTORIES.mirror(position, {
            ...fieldOptions,
            axisAngle: random() * TAU
        });
    } else if(resolvedType === 'cellular') {
        const seedCount = Math.floor(random(cellularSeedCountRange[0], cellularSeedCountRange[1]));
        field = FIELD_FACTORIES.cellular(position, {
            ...fieldOptions,
            seedPoints: createSeedPoints(bounds, seedCount)
        });
    } else {
        field = FIELD_FACTORIES.circle(position, fieldOptions);
    }

    field.weight = random(weightRange[0], weightRange[1]);
    return field;
}

export function generateRandomFields(count, options = {}) {
    const fields = [];
    for(let index = 0; index < count; index += 1) {
        fields.push(generateRandomField(options));
    }
    return fields;
}

export function generateRandomFieldGroup(fieldCount = 4, options = {}) {
    const {
        fields = null,
        aggregator = null,
        ...fieldOptions
    } = options;

    const fieldList = fields ?? generateRandomFields(fieldCount, fieldOptions);
    const resolvedAggregator = aggregator ?? generateRandomAggregator(fieldOptions);
    return new FieldGroup(fieldList, resolvedAggregator);
}

export function generateRandomFlipFieldGroup(options = {}) {
    const {
        groupAFields = null,
        groupBFields = null,
        groupAFieldCount = 4,
        groupBFieldCount = 4,
        groupAOptions = {},
        groupBOptions = {},
        flipField = null,
        flipFieldOptions = {},
        aggregator = null,
        threshold = null,
        thresholdRange = [0.25, 0.75]
    } = options;

    const resolvedAggregator = aggregator ?? generateRandomAggregator(options);
    const groupA = groupAFields ?? generateRandomFieldGroup(groupAFieldCount, {
        ...groupAOptions,
        aggregator: groupAOptions.aggregator ?? resolvedAggregator
    });
    const groupB = groupBFields ?? generateRandomFieldGroup(groupBFieldCount, {
        ...groupBOptions,
        aggregator: groupBOptions.aggregator ?? resolvedAggregator
    });
    const resolvedFlipField = flipField ?? generateRandomField({
        ...flipFieldOptions,
        modulatorOptions: {
            modulatorType: 'decay',
            ...flipFieldOptions.modulatorOptions
        }
    });
    const resolvedThreshold = threshold ?? random(thresholdRange[0], thresholdRange[1]);

    return new FieldFlipGroup(groupA, groupB, resolvedFlipField, resolvedThreshold, resolvedAggregator);
}