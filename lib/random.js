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
    aggregateWeightedAvg: 1.5,
    aggregateWeightedMedian: 0.50,
    aggregateSpread: 0.50,
    aggregateAlternating: 0.50,
    aggregateWeightedStdDev: 0.50,
    aggregateMin: 0.1,
    aggregateMax: 0.1,
    aggregateWeightedRandom: 0.01,
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
        aggregatorTypes = Object.keys(DEFAULT_AGGREGATOR_WEIGHTS),
        aggregatorWeights = DEFAULT_AGGREGATOR_WEIGHTS
    } = options;

    const typeChoices = aggregatorTypes.map((choice) => resolveAggregatorType(choice, AGGREGATOR_FACTORIES));
    const resolvedType = weightedChoice(aggregatorWeights, typeChoices);
    return AGGREGATOR_FACTORIES[resolvedType] ?? aggregateWeightedAvg;
}

function generateFieldPosition(bounds, outsideChance = 0.25, outsideRange = [[-3, -0.5], [1.5, 3]]) {
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
        // The scale for the modulator, used to compute how it behaves over distance. This should be set relative to the size of the field so it behaves in a consistent expected way across various field sizes. Designed to be minimum of width and height, and that is what random generation functions will use when bounds are provided
        scale = null,

        // Choosing the type of modulator
        modulatorTypes = Object.keys(DEFAULT_MODULATOR_WEIGHTS),
        modulatorWeights = DEFAULT_MODULATOR_WEIGHTS,
        
        // Multiplicative factor over the scale - basically the size of the modulator's interval
        modRange = [0.01, 1],

        // A scaling factor for modulator strength. If you want to make modulator behavior on a smaller or larger scale, this is likely the parameter you should adjust (as opposed to modRange or scale since those aim to define the modulator according to the visible sapce; this is more of a direct adjustment of strength). Lower values mean the modulator interval is smaller, versus larger are bigger
        modAffect = 1,

        // Modulators all work on 0-1 ranges, so this adds a chance to invert its result
        invertChance = 0.5,

        // Parameters for specific modulator types
        falloffRateRange = [0.01, 0.05], // Falloff modulators
        stepNumStepsRange = [5, 20], // Step modulators
        squarePeakSize = [0.35, 0.7] // Square wave modulators
    } = options;

    if(scale == null) {
        throw new Error("Cannot generate a random modulator without a scale specified (designed to be min(width, height) of the viewing space). Please provide 'scale' in the modulatorOptions.");
    }

    // Selecting the type
    const typeChoices = modulatorTypes.map((choice) => resolveType(choice, MODULATOR_ALIASES));
    const resolvedType = weightedChoice(modulatorWeights, typeChoices);

    // Computing the modulator value. This is the integral 'strength' factor that determines how the modulator functions over distance
    const rawValue = random(modRange[0], modRange[1]);
    const scaledValue = rawValue * scale;
    const affectedValue = scaledValue * modAffect;
    const modValue = Math.round(affectedValue);

    // Use the mod value (and other parameters as needed) to create the mdulator
    let modulator;
    if(resolvedType === 'falloff') {
        modulator = MODULATOR_FACTORIES.falloff(modValue, { rate: random(...falloffRateRange) });
    } else if(resolvedType === 'step') {
        modulator = MODULATOR_FACTORIES.step(modValue, { numSteps: Math.floor(random(...stepNumStepsRange)) });
    } else if(resolvedType === 'squareWave') {
        modulator = MODULATOR_FACTORIES.squareWave(modValue, { dutyCycle: random(...squarePeakSize) });
    } else {
        const factory = MODULATOR_FACTORIES[resolvedType] ?? MODULATOR_FACTORIES.constant;
        modulator = factory(modValue);
    }

    // Chance to invert the modulator
    modulator.inverted = random() < invertChance;

    return modulator;
}

export function generateRandomField(fieldOptions = {}, modulatorOptions = {}) {
    const {
        // The canvas bounds
        bounds = null, 
        // The size scale for the field
        scale = Math.min(bounds.width, bounds.height),

        // Choosing the type of field
        fieldTypes = Object.keys(DEFAULT_FIELD_WEIGHTS),
        fieldWeights = DEFAULT_FIELD_WEIGHTS,

        // Chance for the field to be positioned outside the bounds, and how far outside it may go
        outsideChance = 0.25,
        outsideRange = [[-3, -0.5], [1.5, 3]],

        // The weight of the new field
        weightRange = [0, 1],

        // Slope for Line Fields
        lineSlopeRange = [-TAU, TAU],

        // Size ranges for Oval and Rect Fields
        widthRange = [0.1, 0.25],
        heightRange = [0.1, 0.25],

        // Parameters for Sine Fields
        sineFrequencyRange = [0.0075, 0.0125],
        sineAmplitudeRange = [0.25, 0.5],

        // Parameters for Vortex Fields
        vortexTurnRateRange = [0.05, 3.0],

        // Parameters for Radial Fields
        radialSpacingRange = [0.0125, 0.075],
        radialWobbleRange = [0, 0.1],

        // Parameters for Cellular Fields
        cellularSeedCountRange = [3, 10],
    } = fieldOptions;

    // Ensure we have bounds (and thus a scale) to work with
    if(bounds == null) {
        throw new Error("Cannot generate a random field without bounds specified. Please provide 'bounds' in the fieldOptions.");
    }

    const typeChoices = fieldTypes.map((choice) => resolveType(choice, FIELD_ALIASES));
    const resolvedType = weightedChoice(fieldWeights, typeChoices);
    const position = generateFieldPosition(bounds, outsideChance, outsideRange);
    const fieldModulator = generateRandomModulator({ scale: scale, ...modulatorOptions });
    const options = { modulator: fieldModulator, scale };

    let field;
    if(resolvedType === 'line') {
        field = FIELD_FACTORIES.line(position, {
            ...options,
            slope: random(...lineSlopeRange)
        });
    } else if(resolvedType === 'segment') {
        field = FIELD_FACTORIES.segment(position, {
            ...options,
            endPosition: [random(bounds.width), random(bounds.height)]
        });
    } else if(resolvedType === 'circle') {
        field = FIELD_FACTORIES.circle(position, options);
    } else if(resolvedType === 'oval' || resolvedType === 'rect') {
        const width = random(...widthRange) * scale;
        const height = random(...heightRange) * scale;
        field = FIELD_FACTORIES[resolvedType](position, {
            ...options,
            width,
            height
        });
    } else if(resolvedType === 'sine') {
        field = FIELD_FACTORIES.sine(position, {
            ...options,
            frequency: random(...sineFrequencyRange),
            angle: random() * TAU,
            amplitude: random(...sineAmplitudeRange) * scale
        });
    } else if(resolvedType === 'vortex') {
        field = FIELD_FACTORIES.vortex(position, {
            ...options,
            turnRate: random(...vortexTurnRateRange)
        });
    } else if(resolvedType === 'radial') {
        field = FIELD_FACTORIES.radial(position, {
            ...options,
            waveSpacing: random(...radialSpacingRange) * scale,
            wobble: random(...radialWobbleRange) * scale
        });
    } else if(resolvedType === 'mirror') {
        field = FIELD_FACTORIES.mirror(position, {
            ...options,
            axisAngle: random() * TAU
        });
    } else if(resolvedType === 'cellular') {
        const seedCount = Math.floor(random(...cellularSeedCountRange));
        field = FIELD_FACTORIES.cellular(position, {
            ...options,
            seedPoints: createSeedPoints(bounds, seedCount)
        });
    } else {
        field = FIELD_FACTORIES.circle(position, options);
    }
    field.bounds = bounds;
    field.weight = random(...weightRange);
    return field;
}

export function generateRandomFields(count, fieldOptions = {}, modulatorOptions = {}) {
    const fields = [];
    for(let index = 0; index < count; index += 1) {
        fields.push(generateRandomField(fieldOptions, modulatorOptions));
    }
    return fields;
}

export function generateRandomFieldGroup(groupOptions = {}) {
    
    // Parse the provided options
    const {
        w = null, 
        h = null,
        fieldCountRange = [4, 8], 
        aggregatorOptions = {}, 
        fieldOptions = {}, 
        modulatorOptions = {}
    } = groupOptions;

    // Setup bounds for field and modulator generation
    if(w === null || h === null) {
        throw new Error("Cannot generate a random field group without width and height specified. Please provide 'w' and 'h' in the groupOptions.");
    }
    const bounds = { width: w, height: h };
    fieldOptions.bounds = bounds;
    modulatorOptions.bounds = bounds;
    
    // Generate the fields
    const numFields = Math.floor(random(...fieldCountRange));
    const fields = generateRandomFields(numFields, fieldOptions, modulatorOptions);

    // Generate the aggregator
    const {
        aggregatorTypes = Object.keys(DEFAULT_AGGREGATOR_WEIGHTS),
        aggregatorWeights = DEFAULT_AGGREGATOR_WEIGHTS,
    } = aggregatorOptions;
    const aggregator = generateRandomAggregator(aggregatorOptions);

    return new FieldGroup(fields, aggregator);
}

export function generateRandomFlipFieldGroup(groupOptions = {}) {
    // Parse the provided options
    const {
        // Bounds - required
        w = null,
        h = null,
        
        // Group A options - optional
        groupAFieldCountRange = [4, 8],
        groupAFieldOptions = {},
        groupAModulatorOptions = {},
        groupAAggregatorOptions = {},

        // Group B options - optional
        groupBFieldCountRange = [4, 8],
        groupBFieldOptions = {},
        groupBModulatorOptions = {},
        groupBAggregatorOptions = {},

        // Flip field options - optional
        flipFieldOptions = {},
        flipFieldModulatorOptions = {},
        flipFieldThresholdRange = [0.25, 0.75]
    } = groupOptions;
    
    const groupA = generateRandomFieldGroup({
        w: w,
        h: h,
        fieldCountRange: groupAFieldCountRange,
        aggregatorOptions: groupAAggregatorOptions,
        fieldOptions: groupAFieldOptions,
        modulatorOptions: groupAModulatorOptions
    });

    const groupB = generateRandomFieldGroup({
        w: w,
        h: h,
        fieldCountRange: groupBFieldCountRange,
        aggregatorOptions: groupBAggregatorOptions,
        fieldOptions: groupBFieldOptions,
        modulatorOptions: groupBModulatorOptions
    });

    const resolvedFlipField = generateRandomField({
        bounds: { width: w, height: h },
        ...flipFieldOptions,
        modulatorOptions: {
            bounds: { width: w, height: h },
            ...flipFieldModulatorOptions
        }
    });

    const resolvedThreshold = random(thresholdRange[0], thresholdRange[1]);

    return new FieldFlipGroup(groupA, groupB, resolvedFlipField, resolvedThreshold, resolvedAggregator);
}