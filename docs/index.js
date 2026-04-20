import { generateColorRamp } from 'https://esm.sh/rampensau';

const fieldSelect = document.getElementById('field-select');
const modulatorSelect = document.getElementById('modulator-select');
const modulatorValueSlider = document.getElementById('modulator-value-slider');
const modulatorValueReadout = document.getElementById('modulator-value-readout');
const aggregatorSelect = document.getElementById('aggregator-select');
const randomizeGroupBtn = document.getElementById('randomize-group');
const randomizeGroupWeightsBtn = document.getElementById('randomize-group-weights');
const randomizeFlipGroupBtn = document.getElementById('randomize-flipgroup');
const flipThresholdSlider = document.getElementById('flip-threshold-slider');
const flipThresholdReadout = document.getElementById('flip-threshold-readout');
const themeToggle = document.getElementById('theme-toggle');
const regenColorsBtn = document.getElementById('regen-colors');
const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
const sectionNodes = Array.from(document.querySelectorAll('.doc-section'));

const fieldsCanvas = document.getElementById('fields-canvas');
const groupsCanvas = document.getElementById('groups-canvas');
const flipgroupCanvas = document.getElementById('flipgroup-canvas');
const fieldDescriptionEl = document.getElementById('field-description');
const modulatorDescriptionEl = document.getElementById('modulator-description');
const aggregatorDescriptionEl = document.getElementById('aggregator-description');
const flipgroupDescriptionEl = document.getElementById('flipgroup-description');
const randomGenerationReference = document.getElementById('random-generation-reference');
const utilitiesReference = document.getElementById('utilities-reference');

const FIELD_TYPES = [
    'CircleField',
    'LineField',
    'SegmentField',
    'RectField',
    'OvalField',
    'SineField',
    'VortexField',
    'RadialField',
    'CrossField',
    'CellularField',
];

const MODULATOR_TYPES = [
    'ConstantModulator',
    'FlippingConstantModulator',
    'FalloffModulator',
    'BinaryModulator',
    'DecayModulator',
    'StepModulator',
    'SquareWaveModulator',
];

const AGGREGATORS = {
    aggregateWeightedAvg: {
        label: 'average',
        description: 'Weighted average of all field values.',
    },
    aggregateWeightedMedian: {
        label: 'median',
        description: 'Weighted median of all field values.',
    },
    aggregateWeightedRandom: {
        label: 'random',
        description: 'Chooses a field value randomly with probability based on weights.',
    },
    aggregateAlternating: {
        label: 'alternating',
        description: 'Uses even-indexed field values for the numerator and odd-indexed weights for normalization, creating rhythmic alternating emphasis.',
    },
    aggregateWeightedStdDev: {
        label: 'std dev',
        description: 'Measures standard deviation across weighted field values.',
    },
    aggregateSpread: {
        label: 'spread',
        description: 'The maximum minus the minimum of weighted field values.',
    },
    aggregateMin: {
        label: 'min',
        description: 'The minimum of weighted field values.',
    },
    aggregateMax: {
        label: 'max',
        description: 'The maximum of weighted field values.',
    },
};

const MODULATOR_VALUE_DEFAULT_PERCENT = 0.10;

const RANDOM_GENERATION_SECTIONS = [
    {
        sectionTitle: 'Field Groups',
        functionName: 'generateRandomFieldGroup',
        description: 'Generates a random FieldGroup with multiple fields combined via an aggregator.',
        defaultExample: `const group = generateRandomFieldGroup();`,
        configuredExample: `const group = generateRandomFieldGroup(6, {
  fieldTypes: ['circle', 'oval', 'sine'],
  aggregatorType: 'aggregateWeightedMedian'
});`,
        options: [
            { name: 'fieldCount', type: 'number', description: 'Number of fields to generate (default: 4).' },
            { name: 'fields', type: 'array', description: 'Supply pre-built fields instead of generating them.' },
            { name: 'aggregator', type: 'function', description: 'Supply an explicit aggregator function.' },
            { name: 'aggregatorType', type: 'string', description: 'Force a specific aggregator type.' },
            { name: 'aggregatorTypes', type: 'array', description: 'Pool of eligible aggregator types.' },
            { name: 'aggregatorWeights', type: 'object', description: 'Weighted selection map for aggregators.' },
            { name: 'fieldTypes', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
            { name: 'fieldWeights', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
            { name: 'bounds', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
            { name: 'position', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
            { name: 'modulatorOptions', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
            { name: 'modulator', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
            { name: 'weightRange', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
            { name: 'lineSlopeRange', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
        ],
    },
    {
        sectionTitle: 'Flipfield Groups',
        functionName: 'generateRandomFlipFieldGroup',
        description: 'Generates a FieldFlipGroup with two independent field groups switched by a routing field.',
        defaultExample: `const flipGroup = generateRandomFlipFieldGroup();`,
        configuredExample: `const flipGroup = generateRandomFlipFieldGroup({
  groupAFieldCount: 4,
  groupBFieldCount: 5,
  thresholdRange: [0.3, 0.7]
});`,
        options: [
            { name: 'groupAFields', type: 'array', description: 'Supply pre-built fields for the A branch.' },
            { name: 'groupBFields', type: 'array', description: 'Supply pre-built fields for the B branch.' },
            { name: 'groupAFieldCount', type: 'number', description: 'Field count for the A branch (default: 4).' },
            { name: 'groupBFieldCount', type: 'number', description: 'Field count for the B branch (default: 4).' },
            { name: 'groupAOptions', type: 'nested', description: 'Nested Field Options for branch A - see generateRandomField.' },
            { name: 'groupBOptions', type: 'nested', description: 'Nested Field Options for branch B - see generateRandomField.' },
            { name: 'flipField', type: 'object', description: 'Supply the flip field directly instead of generating one.' },
            { name: 'flipFieldOptions', type: 'nested', description: 'Nested Field Options for the flip field - see generateRandomField.' },
            { name: 'aggregator', type: 'function', description: 'Supply an explicit aggregator function for both branches.' },
            { name: 'aggregatorType', type: 'string', description: 'Force a specific aggregator type.' },
            { name: 'aggregatorTypes', type: 'array', description: 'Pool of eligible aggregator types.' },
            { name: 'aggregatorWeights', type: 'object', description: 'Weighted selection map for aggregators.' },
            { name: 'threshold', type: 'number', description: 'Explicit switch threshold (0–1).' },
            { name: 'thresholdRange', type: 'array', description: 'Range [min, max] to choose a random threshold (default: [0.25, 0.75]).' },
        ],
    },
    {
        sectionTitle: 'Individual Fields',
        functionName: 'generateRandomField',
        description: 'Generates a single configured field with distance function, geometry, and modulator.',
        defaultExample: `const field = generateRandomField();`,
        configuredExample: `const field = generateRandomField({
  bounds: { width: 1000, height: 600 },
    fieldWeights: { circle: 2, radial: 0.5 }
});`,
        options: [
            { name: 'fieldType', type: 'string', description: 'Force a specific field type.' },
            { name: 'fieldTypes', type: 'array', description: 'Pool of eligible field types.' },
            { name: 'fieldWeights', type: 'object', description: 'Weighted selection map for field types.' },
            { name: 'bounds', type: 'object', description: 'Canvas bounds {width, height} for placement.' },
            { name: 'position', type: 'array', description: 'Override generated position [x, y].' },
            { name: 'outsideChance', type: 'number', description: 'Probability (0–1) of placing field outside bounds.' },
            { name: 'outsideRange', type: 'array', description: 'Ranges for outside placement scaling.' },
            { name: 'scale', type: 'number', description: 'Shared scale for geometry and modulators.' },
            { name: 'weightRange', type: 'array', description: 'Range [min, max] for field weight.' },
            { name: 'lineSlopeRange', type: 'array', description: 'Range [min, max] for LineField slope.' },
            { name: 'widthRange', type: 'array', description: 'Range [min, max] for rect/oval width scale.' },
            { name: 'heightRange', type: 'array', description: 'Range [min, max] for rect/oval height scale.' },
            { name: 'sineFrequencyRange', type: 'array', description: 'Range [min, max] for SineField frequency.' },
            { name: 'sineAmplitudeRange', type: 'array', description: 'Range [min, max] for SineField amplitude scale.' },
            { name: 'vortexTurnRateRange', type: 'array', description: 'Range [min, max] for VortexField turn rate.' },
            { name: 'rippleSpacingRange', type: 'array', description: 'Range [min, max] for RadialField spacing scale.' },
            { name: 'rippleWobbleRange', type: 'array', description: 'Range [min, max] for RadialField wobble scale.' },
            { name: 'cellularSeedCountRange', type: 'array', description: 'Range [min, max] for CellularField seed count.' },
            { name: 'modulator', type: 'object', description: 'Supply a modulator directly instead of generating one.' },
            { name: 'modulatorOptions', type: 'nested', description: 'Nested Modulator Options - see generateRandomModulator.' },
        ],
    },
    {
        sectionTitle: 'Multiple Fields',
        functionName: 'generateRandomFields',
        description: 'Generates multiple individual fields using the same generation options.',
        defaultExample: `const fields = generateRandomFields(4);`,
        configuredExample: `const fields = generateRandomFields(6, {
    fieldWeights: { circle: 2, radial: 0.5 }
});`,
        options: [
            { name: 'count', type: 'number', description: 'How many fields to generate.' },
            { name: '[all field options]', type: 'nested', description: 'Nested Field Options - see generateRandomField.' },
        ],
    },
    {
        sectionTitle: 'Modulators',
        functionName: 'generateRandomModulator',
        description: 'Generates a single modulator with a distance pattern and optional inversion.',
        defaultExample: `const modulator = generateRandomModulator();`,
        configuredExample: `const modulator = generateRandomModulator({
  modulatorType: 'decay',
  size: 100,
  invertChance: 0.5
});`,
        options: [
            { name: 'modulatorType', type: 'string', description: 'Force a specific modulator type.' },
            { name: 'modulatorTypes', type: 'array', description: 'Pool of eligible modulator types.' },
            { name: 'modulatorWeights', type: 'object', description: 'Weighted selection map for modulator types.' },
            { name: 'size', type: 'number', description: 'Scale factor for modulator parameters (default: 100).' },
            { name: 'modAffect', type: 'number', description: 'Multiplier for size (default: 1.0).' },
            { name: 'invertChance', type: 'number', description: 'Probability (0–1) of inverting the modulator (default: 0.5).' },
            { name: 'valueMode', type: 'string', description: 'Value selection: "uniform" or "bimodal" (default: "bimodal").' },
            { name: 'smallValueRange', type: 'array', description: 'Range [min, max] for bimodal small values.' },
            { name: 'largeValueRange', type: 'array', description: 'Range [min, max] for bimodal large values.' },
            { name: 'valueChance', type: 'number', description: 'Probability (0–1) of picking small value in bimodal mode.' },
            { name: 'rateRange', type: 'array', description: 'Range [min, max] for FalloffModulator rate.' },
            { name: 'numStepsChoices', type: 'array', description: 'Allowed step counts for StepModulator.' },
            { name: 'dutyCycleRange', type: 'array', description: 'Range [min, max] for SquareWaveModulator duty cycle.' },
        ],
    },
];

const UTILITY_EXPORTS = [
    ['TAU', 'Mathematical constant for 2*PI.'],
    ['dist', 'Distance between two points.'],
    ['radians', 'Convert degrees to radians.'],
    ['degrees', 'Convert radians to degrees.'],
    ['lerp', 'Linear interpolation between values.'],
    ['constrain', 'Clamp a value between two limits.'],
    ['random', 'Random numbers, ranges, or array entries.'],
];

const FIELD_DESCRIPTIONS = {
    CircleField: 'Distance radiates evenly from a center point.',
    LineField: 'Distance to an infinite line.',
    SegmentField: 'Distance to a finite line segment.',
    RectField: 'Distance to the perimeter of a rectangle.',
    OvalField: 'Distance radiates elliptically from a center point.',
    SineField: 'Distance to a rotated infinite sine wave.',
    VortexField: 'Spiral distance around a center, creating a whirl-like effect.',
    RadialField: 'A radially expanding pattern from a center, like sun rays.',
    CrossField: 'Distance to a cross-shaped pattern.',
    CellularField: 'Nearest boundary to randomly arranged circles.',
};

const MODULATOR_DESCRIPTIONS = {
    ConstantModulator: 'Repeating linear ramp across distance, like a saw wave.',
    FlippingConstantModulator: 'Linear ramp that flips every interval, like a triangle wave.',
    FalloffModulator: 'As distance increases, so does the spacing between intervals.',
    BinaryModulator: 'Alternating on/off bands according to the interval.',
    DecayModulator: 'Values decrease as distance increases.',
    StepModulator: 'Like constant modulator but with quantized steps, creating distinct bands.',
    SquareWaveModulator: 'Similar to the binary modulator, but with configurable peak width for controllable band sizes.',
};

const VIZ_BOUNDS = { width: 960, height: 430 };
const GROUP_FIELD_COUNT_MIN = 4;
const GROUP_FIELD_COUNT_MAX = 8;

let uiPalette = [];
let activeSection = 'introduction';
let currentGroupFields = [];
let currentGroupAggregatorName = 'aggregateWeightedAvg';
let currentFlipGroupData = null;
const sunSvg = 'https://www.svgrepo.com/show/432431/clear-day.svg';
const moonSvg = 'https://www.svgrepo.com/show/432516/moon.svg';

function updateThemeToggleIcon(theme) {
    const showMoon = theme === 'light';
    const iconUrl = showMoon ? moonSvg : sunSvg;
    const nextModeLabel = showMoon ? 'dark' : 'light';
    const modeClass = showMoon ? 'moon-mode' : 'sun-mode';
    themeToggle.innerHTML = `<img src="${iconUrl}" alt="" class="theme-icon ${modeClass}" width="18" height="18">`;
    themeToggle.setAttribute('aria-label', `Switch to ${nextModeLabel} mode`);
    themeToggle.setAttribute('title', `Switch to ${nextModeLabel} mode`);
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function clamp01(value) {
    return clamp(value, 0, 1);
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('modfield-theme', theme);
    updateThemeToggleIcon(theme);
    applyPaletteToUi();
    renderVisibleSection();
}

function initTheme() {
    const saved = localStorage.getItem('modfield-theme');
    if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
        return;
    }

    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function normalizeRampColor(color) {
    if (!color) {
        return null;
    }

    const rawH = Array.isArray(color) ? color[0] : color.h;
    const rawS = Array.isArray(color) ? color[1] : color.s;
    const rawL = Array.isArray(color) ? color[2] : color.l;

    if (!Number.isFinite(rawH) || !Number.isFinite(rawS) || !Number.isFinite(rawL)) {
        return null;
    }

    return {
        h: ((rawH % 360) + 360) % 360,
        s: clamp(rawS > 1 ? rawS : rawS * 100, 0, 100),
        l: clamp(rawL > 1 ? rawL : rawL * 100, 0, 100),
    };
}

function createUiPalette() {
    const sGap = 0.2 + Math.random() * 0.2;
    const sStart = 0.2 + Math.random() * 0.1;
    const sRange = [sStart, sStart + sGap];
    const lRange = [0.3 * Math.random(), 0.9];
    let colors = generateColorRamp({
        total: 12,
        hStart: Math.random() * 360,
        hCycles: 1,
        hStartCenter: 0.5,
        sRange,
        lRange,
    })
        .map(normalizeRampColor)
        .filter((color) => color !== null);

    if (!colors.length) {
        colors = [{ h: 0, s: 0, l: 50 }];
    }

    if (Math.random() < 0.5) {
        colors.reverse();
    }

    return colors;
}

function paletteColorAt(t) {
    if (!uiPalette.length) {
        return { h: 20, s: 48, l: 50 };
    }

    const clamped = clamp01(t);
    const scaled = clamped * (uiPalette.length - 1);
    const floorIndex = Math.floor(scaled);
    const ceilIndex = Math.min(uiPalette.length - 1, floorIndex + 1);
    const mix = scaled - floorIndex;
    const from = uiPalette[floorIndex];
    const to = uiPalette[ceilIndex];

    return {
        h: from.h + (to.h - from.h) * mix,
        s: from.s + (to.s - from.s) * mix,
        l: from.l + (to.l - from.l) * mix,
    };
}

function hslCss(color, alpha = 1) {
    if (alpha >= 1) {
        return `hsl(${color.h.toFixed(1)} ${color.s.toFixed(1)}% ${color.l.toFixed(1)}%)`;
    }

    return `hsla(${color.h.toFixed(1)}, ${color.s.toFixed(1)}%, ${color.l.toFixed(1)}%, ${alpha})`;
}

function applyPaletteToUi() {
    const accent = paletteColorAt(0.26);
    const glowA = paletteColorAt(0.08);
    const glowB = paletteColorAt(0.84);
    const dark = isDarkMode();

    const accentSat = clamp(accent.s * (dark ? 0.72 : 0.78), 24, 78);
    const accentLight = dark
        ? clamp(66 + (accent.l - 50) * 0.12, 58, 76)
        : clamp(44 + (accent.l - 50) * 0.1, 36, 52);

    const style = document.body.style;
    style.setProperty('--accent', `hsl(${accent.h.toFixed(1)} ${accentSat.toFixed(1)}% ${accentLight.toFixed(1)}%)`);
    style.setProperty('--accent-soft', hslCss({
        h: accent.h,
        s: clamp(accentSat * 0.9, 22, 72),
        l: clamp(accentLight + (dark ? 3 : 1), 36, 80),
    }, dark ? 0.24 : 0.2));
    style.setProperty('--bg-spot-a', hslCss({
        h: glowA.h,
        s: clamp(glowA.s * 0.55, 18, 66),
        l: clamp((dark ? 58 : 56) + (glowA.l - 50) * 0.15, dark ? 46 : 44, dark ? 72 : 70),
    }, dark ? 0.13 : 0.15));
    style.setProperty('--bg-spot-b', hslCss({
        h: glowB.h,
        s: clamp(glowB.s * 0.5, 18, 62),
        l: clamp((dark ? 54 : 52) + (glowB.l - 50) * 0.12, dark ? 44 : 42, dark ? 68 : 66),
    }, dark ? 0.1 : 0.12));
}

function populateSelect(select, items, formatter = (item) => item) {
    select.innerHTML = '';
    for (const item of items) {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = formatter(item);
        select.appendChild(option);
    }
}

function labelFromType(typeName) {
    return typeName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\s/, '')
        .replace('Field', '')
        .replace('Modulator', '')
        .trim()
        .toLowerCase();
}

function wireSectionTabs() {
    for (const btn of navButtons) {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            if (!section) {
                return;
            }
            setActiveSection(section);
        });
    }
}

function setActiveSection(sectionName) {
    activeSection = sectionName;

    for (const btn of navButtons) {
        btn.setAttribute('aria-selected', String(btn.getAttribute('data-section') === sectionName));
    }

    for (const section of sectionNodes) {
        section.classList.toggle('active', section.getAttribute('data-section') === sectionName);
    }

    renderVisibleSection();
}

function currentModulatorValueMultiplier() {
    const sliderPercent = Number(modulatorValueSlider?.value);
    const safePercent = Number.isFinite(sliderPercent) ? sliderPercent : MODULATOR_VALUE_DEFAULT_PERCENT;
    return safePercent;
}

function updateModulatorValueReadout() {
    if (!modulatorValueReadout) {
        return;
    }

    const sliderPercent = Number(modulatorValueSlider?.value);
    const safePercent = Number.isFinite(sliderPercent) ? sliderPercent : MODULATOR_VALUE_DEFAULT_PERCENT;
    const multiplier = safePercent / 100;
    modulatorValueReadout.textContent = `${safePercent.toFixed(2)}%`;
}

function makeModulator(type, scale, valueMultiplier = MODULATOR_VALUE_DEFAULT_PERCENT) {
    const modValue = Math.max(scale * valueMultiplier, 0.000001);

    switch (type) {
        case 'ConstantModulator':
            return new ModField.ConstantModulator(modValue);
        case 'FlippingConstantModulator':
            return new ModField.FlippingConstantModulator(modValue);
        case 'FalloffModulator':
            return new ModField.FalloffModulator(modValue, 0.03);
        case 'BinaryModulator':
            return new ModField.BinaryModulator(modValue);
        case 'DecayModulator':
            return new ModField.DecayModulator(modValue);
        case 'StepModulator':
            return new ModField.StepModulator(modValue, 5);
        case 'SquareWaveModulator':
            return new ModField.SquareWaveModulator(modValue, 0.35);
        default:
            return new ModField.ConstantModulator(modValue);
    }
}

function makeField(type, modulator, width, height) {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const scale = Math.min(width, height);

    switch (type) {
        case 'CircleField':
            return new ModField.CircleField([cx, cy], modulator);
        case 'LineField':
            return new ModField.LineField([cx, cy], 0.15, modulator);
        case 'SegmentField':
            return new ModField.SegmentField([width * 0.2, height * 0.7], [width * 0.8, height * 0.3], modulator);
        case 'RectField':
            return new ModField.RectField([cx, cy], scale * 0.45, scale * 0.24, modulator);
        case 'OvalField':
            return new ModField.OvalField([cx, cy], scale * 0.34, scale * 0.22, modulator);
        case 'SineField':
            return new ModField.SineField([width * 0.15, cy], 0.03, Math.PI * 0.16, scale * 0.1, modulator);
        case 'VortexField':
            return new ModField.VortexField([cx, cy], 1.3, modulator, scale);
        case 'RadialField':
            return new ModField.RadialField([cx, cy], scale * 0.08, scale * 0.03, modulator);
        case 'CrossField':
            return new ModField.CrossField([cx, cy], Math.PI * 0.17, modulator);
        case 'CellularField': {
            const seeds = [
                [width * 0.22, height * 0.28],
                [width * 0.76, height * 0.26],
                [width * 0.48, height * 0.66],
                [width * 0.23, height * 0.74],
            ];
            return new ModField.CellularField(seeds, modulator, scale);
        }
        default:
            return new ModField.CircleField([cx, cy], modulator);
    }
}

function makeGrid(width, height, targetCell = 14) {
    const cols = Math.max(1, Math.ceil(width / targetCell));
    const rows = Math.max(1, Math.ceil(height / targetCell));
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    return {
        width,
        height,
        cols,
        rows,
        cellWidth,
        cellHeight,
        totalCells: cols * rows,
    };
}

function sampleFieldGroup(group, grid) {
    const raw = new Float32Array(grid.totalCells);
    let index = 0;

    for (let row = 0; row < grid.rows; row += 1) {
        for (let col = 0; col < grid.cols; col += 1) {
            const px = grid.cellWidth * (col + 0.5);
            const py = grid.cellHeight * (row + 0.5);
            raw[index] = group.mod([px, py]);
            index += 1;
        }
    }

    const normalized = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
        normalized[i] = clamp01(group.normalize(raw[i]));
    }

    return { ...grid, raw, normalized };
}

function fitCanvas(canvas, targetHeight) {
    const containerWidth = Math.max(280, Math.floor(canvas.parentElement?.clientWidth || VIZ_BOUNDS.width));
    const finalHeight = Math.max(220, Math.floor(targetHeight));

    if (canvas.width !== containerWidth) {
        canvas.width = containerWidth;
    }

    if (canvas.height !== finalHeight) {
        canvas.height = finalHeight;
    }

    return { width: canvas.width, height: canvas.height };
}

function drawSampleToCanvas(canvas, sample) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let index = 0;
    for (let row = 0; row < sample.rows; row += 1) {
        for (let col = 0; col < sample.cols; col += 1) {
            const value = sample.normalized[index] ?? 0;
            const color = paletteColorAt(value);
            ctx.fillStyle = hslCss(color, 1);
            ctx.fillRect(col * sample.cellWidth, row * sample.cellHeight, sample.cellWidth + 0.5, sample.cellHeight + 0.5);
            index += 1;
        }
    }
}

function renderFieldsSection() {
    const fieldType = fieldSelect.value;
    const modulatorType = modulatorSelect.value;
    const { width, height } = fitCanvas(fieldsCanvas, 430);
    const modulator = makeModulator(modulatorType, Math.min(width, height), currentModulatorValueMultiplier());
    const field = makeField(fieldType, modulator, width, height);
    const group = new ModField.FieldGroup([field], ModField.aggregateWeightedAvg);

    const sample = sampleFieldGroup(group, makeGrid(width, height, 12));
    drawSampleToCanvas(fieldsCanvas, sample);

    fieldDescriptionEl.textContent = FIELD_DESCRIPTIONS[fieldType] ?? 'No description available for this field.';
    modulatorDescriptionEl.textContent = MODULATOR_DESCRIPTIONS[modulatorType] ?? 'No description available for this modulator.';
}

function createRandomFieldModel(width, height) {
    const fieldType = pick(FIELD_TYPES);
    const modulatorType = pick(MODULATOR_TYPES);
    const scale = Math.min(width, height);
    const modulator = makeModulator(modulatorType, scale);
    const field = makeField(fieldType, modulator, width, height);

    return { field, fieldType, modulatorType };
}

function randomizeGroupFields() {
    const count = randomInt(GROUP_FIELD_COUNT_MIN, GROUP_FIELD_COUNT_MAX);
    currentGroupFields = ModField.generateRandomFields(count, {
        bounds: { width: VIZ_BOUNDS.width, height: VIZ_BOUNDS.height },
        scale: Math.min(VIZ_BOUNDS.width, VIZ_BOUNDS.height),
    });
}

function randomizeCurrentGroupWeights(minWeight = 0, maxWeight = 1) {
    if (!currentGroupFields.length) {
        randomizeGroupFields();
    }

    const min = Math.min(minWeight, maxWeight);
    const max = Math.max(minWeight, maxWeight);
    for (const field of currentGroupFields) {
        field.weight = min + Math.random() * (max - min);
    }
}

function randomizeFlipGroup() {
    const countA = randomInt(2, 5);
    const countB = randomInt(2, 5);
    const scale = Math.min(VIZ_BOUNDS.width, VIZ_BOUNDS.height);

    currentFlipGroupData = {
        groupAFields: ModField.generateRandomFields(countA, {
            bounds: { width: VIZ_BOUNDS.width, height: VIZ_BOUNDS.height },
            scale,
        }),
        groupBFields: ModField.generateRandomFields(countB, {
            bounds: { width: VIZ_BOUNDS.width, height: VIZ_BOUNDS.height },
            scale,
        }),
        flipFieldModel: createRandomFieldModel(VIZ_BOUNDS.width, VIZ_BOUNDS.height),
        threshold: 0.35 + Math.random() * 0.3,
    };

    updateFlipThresholdControls();
}

function updateFlipThresholdControls() {
    const threshold = clamp01(currentFlipGroupData?.threshold ?? 0.5);

    if (flipThresholdSlider) {
        flipThresholdSlider.value = threshold.toFixed(2);
    }

    if (flipThresholdReadout) {
        flipThresholdReadout.textContent = threshold.toFixed(2);
    }
}

function currentAggregatorFunction() {
    return ModField[currentGroupAggregatorName] ?? ModField.aggregateWeightedAvg;
}

function renderGroupsSection() {
    if (!currentGroupFields.length) {
        randomizeGroupFields();
    }

    if (!currentFlipGroupData) {
        randomizeFlipGroup();
    }

    const normalSize = fitCanvas(groupsCanvas, 330);
    const group = new ModField.FieldGroup(currentGroupFields, currentAggregatorFunction());
    const sample = sampleFieldGroup(group, makeGrid(normalSize.width, normalSize.height, 12));
    drawSampleToCanvas(groupsCanvas, sample);

    const aggregatorMeta = AGGREGATORS[currentGroupAggregatorName] ?? AGGREGATORS.aggregateWeightedAvg;
    aggregatorDescriptionEl.textContent = aggregatorMeta.description;

    const flipSize = fitCanvas(flipgroupCanvas, 330);
    const aggregator = currentAggregatorFunction();
    const flipGroup = new ModField.FieldFlipGroup(
        new ModField.FieldGroup(currentFlipGroupData.groupAFields, aggregator),
        new ModField.FieldGroup(currentFlipGroupData.groupBFields, aggregator),
        currentFlipGroupData.flipFieldModel.field,
        currentFlipGroupData.threshold,
        aggregator,
    );

    const flipGrid = makeGrid(flipSize.width, flipSize.height, 12);
    const sampleA = sampleFieldGroup(flipGroup.groupA, flipGrid);
    const sampleB = sampleFieldGroup(flipGroup.groupB, flipGrid);
    const flipCtx = flipgroupCanvas.getContext('2d');

    if (flipCtx) {
        flipCtx.clearRect(0, 0, flipgroupCanvas.width, flipgroupCanvas.height);
        for (let row = 0; row < flipGrid.rows; row += 1) {
            for (let col = 0; col < flipGrid.cols; col += 1) {
                const index = row * flipGrid.cols + col;
                const px = flipGrid.cellWidth * (col + 0.5);
                const py = flipGrid.cellHeight * (row + 0.5);
                const flipValue = flipGroup.flipField.mod([px, py]);
                const useB = flipValue > flipGroup.threshold;
                const source = useB ? sampleB.normalized[index] : sampleA.normalized[index];
                const color = paletteColorAt(source ?? 0);
                flipCtx.fillStyle = hslCss(color, 1);
                flipCtx.fillRect(col * flipGrid.cellWidth, row * flipGrid.cellHeight, flipGrid.cellWidth + 0.5, flipGrid.cellHeight + 0.5);
            }
        }
    }

    flipgroupDescriptionEl.textContent = `Flip field: ${currentFlipGroupData.flipFieldModel.fieldType} using a ${labelFromType(currentFlipGroupData.flipFieldModel.modulatorType)} modulator. Threshold: ${currentFlipGroupData.threshold.toFixed(2)}.`;
}

function renderVisibleSection() {
    if (activeSection === 'fields-modulators') {
        renderFieldsSection();
        return;
    }

    if (activeSection === 'groups-aggregators') {
        renderGroupsSection();
    }
}

function renderRandomGenerationReference() {
    randomGenerationReference.innerHTML = RANDOM_GENERATION_SECTIONS.map((section, sectionIdx) => {
        const optionsHtml = section.options.map((opt, optIdx) => {
            const isNested = opt.type === 'nested';
            const classList = isNested ? 'option-item nested-option' : 'option-item';
            return `<div class="${classList}">
                <span class="option-name">${opt.name}</span>
                <span class="option-type">${opt.type}</span>
                <p class="option-desc">${opt.description}</p>
            </div>`;
        }).join('');

        const dropdownId = `options-dropdown-${sectionIdx}`;

        return `
            <section class="random-generation-function-section card">
                <div class="section-header">
                    <h3>${section.functionName}</h3>
                    <p class="section-subtitle">${section.sectionTitle}</p>
                </div>
                <p class="section-description">${section.description}</p>

                <div class="examples-grid">
                    <div class="example-card">
                        <h4>Simple Call (Entirely Random)</h4> 
                        <pre><code>${section.defaultExample}</code></pre>
                    </div>
                    <div class="example-card">
                        <h4>Sample Configured Call (Controlled Random)</h4>
                        <pre><code>${section.configuredExample}</code></pre>
                    </div>
                </div>

                <div class="options-section">
                    <button class="options-toggle" data-dropdown="${dropdownId}" aria-expanded="false">
                        ▶ Configuration Options
                    </button>
                    <div class="options-dropdown" id="${dropdownId}" style="display: none;">
                        <div class="options-list">
                            ${optionsHtml}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }).join('');

    // Wire up dropdown toggles
    document.querySelectorAll('.options-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dropdownId = btn.getAttribute('data-dropdown');
            const dropdown = document.getElementById(dropdownId);
            const isOpen = btn.getAttribute('aria-expanded') === 'true';

            btn.setAttribute('aria-expanded', String(!isOpen));
            dropdown.style.display = isOpen ? 'none' : 'block';
        });
    });
}

function renderUtilitiesReference() {
    utilitiesReference.innerHTML = UTILITY_EXPORTS.map(([name, description]) => `
        <div class="utility-item">
            <strong>${name}</strong>
            <span>${description}</span>
        </div>
    `).join('');
}

function wireFieldsControls() {
    fieldSelect.addEventListener('change', () => {
        if (activeSection === 'fields-modulators') {
            renderFieldsSection();
        }
    });

    modulatorSelect.addEventListener('change', () => {
        if (activeSection === 'fields-modulators') {
            renderFieldsSection();
        }
    });

    modulatorValueSlider?.addEventListener('input', () => {
        updateModulatorValueReadout();
        if (activeSection === 'fields-modulators') {
            renderFieldsSection();
        }
    });
}

function wireGroupsControls() {
    aggregatorSelect.addEventListener('change', () => {
        currentGroupAggregatorName = aggregatorSelect.value;
        if (activeSection === 'groups-aggregators') {
            renderGroupsSection();
        }
    });

    randomizeGroupBtn.addEventListener('click', () => {
        randomizeGroupFields();
        if (activeSection === 'groups-aggregators') {
            renderGroupsSection();
        }
    });

    randomizeGroupWeightsBtn?.addEventListener('click', () => {
        randomizeCurrentGroupWeights();
        if (activeSection === 'groups-aggregators') {
            renderGroupsSection();
        }
    });

    randomizeFlipGroupBtn.addEventListener('click', () => {
        randomizeFlipGroup();
        if (activeSection === 'groups-aggregators') {
            renderGroupsSection();
        }
    });

    flipThresholdSlider?.addEventListener('input', () => {
        const thresholdValue = clamp01(Number(flipThresholdSlider.value));

        if (!currentFlipGroupData) {
            randomizeFlipGroup();
        }

        currentFlipGroupData.threshold = thresholdValue;
        updateFlipThresholdControls();

        if (activeSection === 'groups-aggregators') {
            renderGroupsSection();
        }
    });
}

function wireThemeToggle() {
    themeToggle.addEventListener('click', () => {
        const current = isDarkMode() ? 'dark' : 'light';
        setTheme(current === 'dark' ? 'light' : 'dark');
    });
}

function wireRegenColors() {
    regenColorsBtn.addEventListener('click', () => {
        uiPalette = createUiPalette();
        applyPaletteToUi();
        renderVisibleSection();
    });
}

function populateControls() {
    populateSelect(fieldSelect, FIELD_TYPES, labelFromType);
    populateSelect(modulatorSelect, MODULATOR_TYPES, labelFromType);

    const aggregatorNames = Object.keys(AGGREGATORS);
    populateSelect(aggregatorSelect, aggregatorNames, (name) => AGGREGATORS[name].label);

    fieldSelect.value = 'CircleField';
    modulatorSelect.value = 'ConstantModulator';
    if (modulatorValueSlider) {
        modulatorValueSlider.value = MODULATOR_VALUE_DEFAULT_PERCENT.toFixed(2);
    }
    updateModulatorValueReadout();
    updateFlipThresholdControls();
    aggregatorSelect.value = currentGroupAggregatorName;
}

function start() {
    if (typeof ModField === 'undefined') {
        console.error('ModField bundle not loaded.');
        return;
    }

    uiPalette = createUiPalette();
    initTheme();
    applyPaletteToUi();

    populateControls();
    renderRandomGenerationReference();
    renderUtilitiesReference();
    wireSectionTabs();
    wireFieldsControls();
    wireGroupsControls();
    wireThemeToggle();
    wireRegenColors();

    randomizeGroupFields();
    randomizeFlipGroup();

    setActiveSection('introduction');
}

document.addEventListener('DOMContentLoaded', start);
