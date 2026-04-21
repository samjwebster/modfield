import { generateColorRamp } from 'https://esm.sh/rampensau';

const AUTO_INTERVAL_MS = 20000;
const MIN_CELL_SIZE = 0.01;
const MAX_CELL_SIZE = 0.1;
const DEFAULT_CELL_SIZE = 0.025;
const DEFAULT_FIELD_MIN = 3;
const DEFAULT_FIELD_MAX = 6;
const MAX_FIELD_COUNT = 16;
const SAMPLE_WIDTH = 1000;
const SAMPLE_HEIGHT = SAMPLE_WIDTH * 0.6;
const SHAPE_PADDING_MIN = 0;
const SHAPE_PADDING_MAX = 0.24;
const DEFAULT_SHAPE_PADDING = 0.05;
const MOD_AFFECT_MIN = 0.1;
const MOD_AFFECT_MAX = 3.0;
const DEFAULT_MOD_AFFECT = 1.0;

const countdownEl = document.getElementById('countdown');
const regenBtn = document.getElementById('regen-btn');
const themeToggle = document.getElementById('theme-toggle');
const configToggle = document.getElementById('config-toggle');
const configPanel = document.getElementById('config-panel');
const workspace = document.getElementById('workspace');
const cellSizeSlider = document.getElementById('cell-size');
const cellSizeValue = document.getElementById('cell-size-value');
const shapeModeSelect = document.getElementById('shape-mode');
const shapePaddingSlider = document.getElementById('shape-padding');
const shapePaddingValue = document.getElementById('shape-padding-value');
const colorMixingToggle = document.getElementById('color-mixing');
const greyscaleToggle = document.getElementById('greyscale');
const modAffectSlider = document.getElementById('mod-affect');
const modAffectValue = document.getElementById('mod-affect-value');
const fieldCountMinInput = document.getElementById('field-count-min');
const fieldCountMaxInput = document.getElementById('field-count-max');
const resetSettingsBtn = document.getElementById('reset-settings');

const config = {
    cellSize: DEFAULT_CELL_SIZE,
    fieldMin: DEFAULT_FIELD_MIN,
    fieldMax: DEFAULT_FIELD_MAX,
    shapeMode: 'rounded-rect',
    shapePadding: DEFAULT_SHAPE_PADDING,
    colorMixing: true,
    greyscale: false,
    modAffect: DEFAULT_MOD_AFFECT,
};

let nextAutoAt = Date.now() + AUTO_INTERVAL_MS;
let autoTimer = null;
let countdownTimer;
let p5Instance;
let normalizedValues = new Float32Array(0);
let gridCols = 0;
let gridRows = 0;
let cellWidth = 0;
let cellHeight = 0;
let activePaletteColors = [];
let currentFieldGroup = null;
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

function readNumberInput(input, fallback) {
    const value = Number.parseFloat(input.value);
    return Number.isFinite(value) ? value : fallback;
}

function formatCellSize(value) {
    return `${(value * 100).toFixed(1)}%`;
}

function formatPadding(value) {
    return `${Math.round(value * 100)}%`;
}

function formatModAffect(value) {
    return `${value.toFixed(1)}x`;
}

function setCellSize(value, syncInput = true) {
    config.cellSize = clamp(value, MIN_CELL_SIZE, MAX_CELL_SIZE);
    if (syncInput) {
        cellSizeSlider.value = String(config.cellSize);
    }
    cellSizeValue.textContent = formatCellSize(config.cellSize);
}

function setShapePadding(value, syncInput = true) {
    config.shapePadding = clamp(value, SHAPE_PADDING_MIN, SHAPE_PADDING_MAX);
    if (syncInput) {
        shapePaddingSlider.value = String(config.shapePadding);
    }
    shapePaddingValue.textContent = formatPadding(config.shapePadding);
}

function setModAffect(value, syncInput = true) {
    config.modAffect = clamp(value, MOD_AFFECT_MIN, MOD_AFFECT_MAX);
    if (syncInput) {
        modAffectSlider.value = String(config.modAffect);
    }
    modAffectValue.textContent = formatModAffect(config.modAffect);
}

function syncFieldRange() {
    let minValue = Math.max(1, Math.min(MAX_FIELD_COUNT, Math.floor(readNumberInput(fieldCountMinInput, DEFAULT_FIELD_MIN))));
    let maxValue = Math.max(1, Math.min(MAX_FIELD_COUNT, Math.floor(readNumberInput(fieldCountMaxInput, DEFAULT_FIELD_MAX))));

    if (minValue > maxValue) {
        maxValue = minValue;
    }

    fieldCountMinInput.value = String(minValue);
    fieldCountMaxInput.value = String(maxValue);

    config.fieldMin = minValue;
    config.fieldMax = maxValue;
}

function currentCanvasSize() {
    const container = document.querySelector('.viz-frame');
    const width = container?.offsetWidth || SAMPLE_WIDTH;
    const height = Math.min(Math.max(300, width * 0.6), 620);
    return { width, height };
}

function recalculateGrid() {
    const { width, height } = currentCanvasSize();
    const target = Math.max(8, Math.min(width, height) * config.cellSize);
    gridRows = Math.max(1, Math.ceil(height / target));
    gridCols = Math.max(1, Math.ceil(width / target));
    cellWidth = width / gridCols;
    cellHeight = height / gridRows;

    const totalCells = gridCols * gridRows;
    if (normalizedValues.length !== totalCells) {
        normalizedValues = new Float32Array(totalCells);
    }
}

function normalizeRampColor(color) {
    if (!color) {
        return null;
    }

    let h;
    let s;
    let l;

    if (Array.isArray(color)) {
        [h, s, l] = color;
    } else {
        h = color.h;
        s = color.s;
        l = color.l;
    }

    if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
        return null;
    }

    const sat = s > 1 ? s : s * 100;
    const lig = l > 1 ? l : l * 100;

    return {
        h: ((h % 360) + 360) % 360,
        s: clamp(sat, 0, 100),
        l: clamp(lig, 0, 100),
    };
}

function generateRandomColors() {
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

function paletteColorAtNormalizedPosition(t) {
    if(config.greyscale) {
        return { h: 0, s: 0, l: clamp(t, 0, 1) * 100 };
    }

    if (!activePaletteColors.length) {
        return { h: 28, s: 40, l: 50 };
    }

    const clamped = clamp01(t);
    const scaled = clamped * (activePaletteColors.length - 1);
    const indexFloor = Math.floor(scaled);
    const indexCeil = Math.min(activePaletteColors.length - 1, indexFloor + 1);
    const mix = scaled - indexFloor;

    if (!config.colorMixing) {
        return activePaletteColors[indexFloor];
    }

    const from = activePaletteColors[indexFloor];
    const to = activePaletteColors[indexCeil];

    return {
        h: from.h + (to.h - from.h) * mix,
        s: from.s + (to.s - from.s) * mix,
        l: from.l + (to.l - from.l) * mix,
    };
}

function applyPaletteToUi() {
    if (!activePaletteColors.length) {
        return;
    }

    const dark = isDarkMode();
    const accentBase = paletteColorAtNormalizedPosition(0.28);
    const glowBaseA = paletteColorAtNormalizedPosition(0.12);
    const glowBaseB = paletteColorAtNormalizedPosition(0.84);

    const accentSat = clamp(accentBase.s * (dark ? 0.72 : 0.78), 24, 78);
    const accentLight = dark
        ? clamp(66 + (accentBase.l - 50) * 0.12, 58, 76)
        : clamp(44 + (accentBase.l - 50) * 0.1, 36, 52);
    const softSat = clamp(accentSat * 0.9, 22, 72);
    const softLight = dark ? clamp(accentLight + 3, 60, 80) : clamp(accentLight + 1, 36, 56);

    const glowSatA = clamp(glowBaseA.s * 0.58, 18, 66);
    const glowLightA = dark
        ? clamp(58 + (glowBaseA.l - 50) * 0.16, 46, 72)
        : clamp(56 + (glowBaseA.l - 50) * 0.14, 44, 70);
    const glowSatB = clamp(glowBaseB.s * 0.52, 18, 62);
    const glowLightB = dark
        ? clamp(54 + (glowBaseB.l - 50) * 0.14, 44, 68)
        : clamp(52 + (glowBaseB.l - 50) * 0.12, 42, 66);

    const style = document.body.style;
    style.setProperty('--accent', `hsl(${accentBase.h.toFixed(1)} ${accentSat.toFixed(1)}% ${accentLight.toFixed(1)}%)`);
    style.setProperty('--accent-soft', `hsla(${accentBase.h.toFixed(1)}, ${softSat.toFixed(1)}%, ${softLight.toFixed(1)}%, ${dark ? 0.24 : 0.2})`);
    style.setProperty('--bg-spot-a', `hsla(${glowBaseA.h.toFixed(1)}, ${glowSatA.toFixed(1)}%, ${glowLightA.toFixed(1)}%, ${dark ? 0.13 : 0.15})`);
    style.setProperty('--bg-spot-b', `hsla(${glowBaseB.h.toFixed(1)}, ${glowSatB.toFixed(1)}%, ${glowLightB.toFixed(1)}%, ${dark ? 0.1 : 0.12})`);
}

function createRandomFieldGroup() {
    const fg = modfield.generateRandomFieldGroup({
        w: SAMPLE_WIDTH,
        h: SAMPLE_HEIGHT,
        fieldCountRange: [config.fieldMin, config.fieldMax],
        modulatorOptions: {
            modAffect: config.modAffect,
        },
    });

    return {
        group: fg,
    };
}

function fieldGroupValues(group) {
    const totalCells = gridCols * gridRows;
    const rawValues = new Float32Array(totalCells);
    let index = 0;

    for (let row = 0; row < gridRows; row += 1) {
        for (let column = 0; column < gridCols; column += 1) {
            const px = cellWidth * (column + 0.5);
            const py = cellHeight * (row + 0.5);
            rawValues[index] = group.mod([px, py]);
            index += 1;
        }
    }

    for (let i = 0; i < totalCells; i += 1) {
        normalizedValues[i] = clamp01(group.normalize(rawValues[i]));
    }

    return normalizedValues;
}

function drawCurrentVisualization() {
    if (p5Instance) {
        drawVisualization(p5Instance);
    }
}

function recalculateValuesFromCurrentFieldGroup() {
    if (!currentFieldGroup) {
        return;
    }

    fieldGroupValues(currentFieldGroup);
}

function rerenderWithCurrentFieldGroup({ recalcGrid = false, recalcValues = false, reapplyPalette = false } = {}) {
    if (recalcGrid) {
        recalculateGrid();
    }

    if (recalcValues) {
        recalculateValuesFromCurrentFieldGroup();
    }

    if (reapplyPalette) {
        applyPaletteToUi();
    }

    drawCurrentVisualization();
}

function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function paletteColorAt(value, xNorm, yNorm) {
    if (!activePaletteColors.length) {
        activePaletteColors = generateRandomColors();
        applyPaletteToUi();
    }

    const sample = clamp01((value * 0.82) + (xNorm * 0.13) + (yNorm * 0.05));
    const baseColor = paletteColorAtNormalizedPosition(sample);


    // const baseColor = activePaletteColors[index];
    // const baseLightness = baseColor[2];
    // const saturation = clamp01((baseColor[1] * 0.8) + 0.12 + (value * 0.08));
    // const lightness = isDarkMode()
    //     ? clamp01(0.92 - value * 0.7 + (baseLightness - 0.5) * 0.08)
    //     : clamp01(0.18 + value * 0.68 + (baseLightness - 0.5) * 0.08);

    // return {
    //     h: baseColor[0],
    //     s: saturation * 100,
    //     l: lightness * 100,
    // };

    return baseColor;
}

function drawShape(p, mode, x, y, w, h, radius) {
    switch (mode) {
        case 'circle':
            p.circle(x + w / 2, y + h / 2, Math.min(w, h));
            break;
        case 'rounded-rect':
            p.rect(x, y, w, h, radius);
            break;
        case 'rect':
            p.rect(x, y, w, h);
            break;
        case 'diamond':
            p.beginShape();
            p.vertex(x + w / 2, y);
            p.vertex(x + w, y + h / 2);
            p.vertex(x + w / 2, y + h);
            p.vertex(x, y + h / 2);
            p.endShape(p.CLOSE);
            break;
        case 'triangle':
            p.beginShape();
            p.vertex(x + w / 2, y);
            p.vertex(x + w, y + h);
            p.vertex(x, y + h);
            p.endShape(p.CLOSE);
            break;
        default:
            p.circle(x + w / 2, y + h / 2, Math.min(w, h));
            break;
    }
}

function drawVisualization(p) {
    if (!p) {
        return;
    }

    p.background(0, 0, isDarkMode() ? 7 : 98);

    const totalCells = gridCols * gridRows;
    const paddingX = cellWidth * config.shapePadding;
    const paddingY = cellHeight * config.shapePadding;
    const drawWidth = Math.max(0, cellWidth - paddingX * 2);
    const drawHeight = Math.max(0, cellHeight - paddingY * 2);
    const radius = Math.min(drawWidth, drawHeight) * 0.28;

    p.fill(0, 0, 50);
    p.noStroke();

    for (let index = 0; index < totalCells; index += 1) {
        const column = index % gridCols;
        const row = Math.floor(index / gridCols);
        const norm = normalizedValues[index] ?? 0;
        const col = paletteColorAt(norm, column / Math.max(gridCols - 1, 1), row / Math.max(gridRows - 1, 1));

        p.fill(col.h, col.s, col.l);
        drawShape(
            p,
            config.shapeMode,
            column * cellWidth + paddingX,
            row * cellHeight + paddingY,
            drawWidth,
            drawHeight,
            radius
        );
    }
}

function p5Sketch(p) {
    let viewportWidth = 0;
    let viewportHeight = 0;

    p.setup = function() {
        const size = currentCanvasSize();
        viewportWidth = size.width;
        viewportHeight = size.height;
        p.createCanvas(viewportWidth, viewportHeight * 0.8).parent('canvas-container');
        p.colorMode(p.HSL, 360, 100, 100);
        p.noStroke();
        drawVisualization(p);
    };

    p.windowResized = function() {
        const size = currentCanvasSize();
        if (Math.abs(size.width - viewportWidth) > 10 || Math.abs(size.height - viewportHeight) > 10) {
            viewportWidth = size.width;
            viewportHeight = size.height;
            p.resizeCanvas(viewportWidth, viewportHeight * 0.8);
            rerenderWithCurrentFieldGroup({
                recalcGrid: true,
                recalcValues: true,
            });
        }
    };

    p.draw = function() {};
}

function refresh() {
    if (typeof modfield === 'undefined') {
        console.error('modfield.js not loaded');
        return;
    }

    recalculateGrid();
    activePaletteColors = generateRandomColors();
    applyPaletteToUi();

    const result = createRandomFieldGroup();
    currentFieldGroup = result.group;
    recalculateValuesFromCurrentFieldGroup();
    drawCurrentVisualization();

    scheduleAutoRefresh();
}

function updateCountdown() {
    const msLeft = Math.max(0, nextAutoAt - Date.now());
    const secLeft = Math.ceil(msLeft / 1000);
    countdownEl.textContent = `regenerating in ${secLeft}s`;
}

function scheduleAutoRefresh() {
    if (autoTimer) {
        clearTimeout(autoTimer);
    }

    nextAutoAt = Date.now() + AUTO_INTERVAL_MS;
    updateCountdown();

    autoTimer = window.setTimeout(() => {
        autoTimer = null;
        refresh();
    }, AUTO_INTERVAL_MS);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('modfield-theme', theme);
    updateThemeToggleIcon(theme);

    rerenderWithCurrentFieldGroup({ reapplyPalette: true });
}

function initTheme() {
    const saved = localStorage.getItem('modfield-theme');
    if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
        return;
    }

    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function updateConfigDisplay() {
    cellSizeValue.textContent = formatCellSize(config.cellSize);
    shapePaddingValue.textContent = formatPadding(config.shapePadding);
    modAffectValue.textContent = formatModAffect(config.modAffect);
    colorMixingToggle.checked = config.colorMixing;
    greyscaleToggle.checked = config.greyscale;
}

function resetSettingsToDefaults() {
    setCellSize(DEFAULT_CELL_SIZE, true);
    setShapePadding(DEFAULT_SHAPE_PADDING, true);
    setModAffect(DEFAULT_MOD_AFFECT, true);
    config.shapeMode = 'rounded-rect';
    shapeModeSelect.value = config.shapeMode;
    config.colorMixing = true;
    colorMixingToggle.checked = true;
    config.greyscale = false;
    greyscaleToggle.checked = false;

    fieldCountMinInput.value = String(DEFAULT_FIELD_MIN);
    fieldCountMaxInput.value = String(DEFAULT_FIELD_MAX);
    syncFieldRange();

    rerenderWithCurrentFieldGroup({
        recalcGrid: true,
        recalcValues: true,
        reapplyPalette: true,
    });
}

function wireConfigControls() {
    configToggle.addEventListener('click', () => {
        configPanel.classList.toggle('open');
        workspace.classList.toggle('with-config', configPanel.classList.contains('open'));
    });

    cellSizeSlider.addEventListener('input', () => {
        setCellSize(Number(cellSizeSlider.value), false);
        rerenderWithCurrentFieldGroup({
            recalcGrid: true,
            recalcValues: true,
        });
    });

    shapePaddingSlider.addEventListener('input', () => {
        setShapePadding(Number(shapePaddingSlider.value), false);
        drawCurrentVisualization();
    });

    shapeModeSelect.addEventListener('change', () => {
        config.shapeMode = shapeModeSelect.value;
        drawCurrentVisualization();
    });

    colorMixingToggle.addEventListener('change', () => {
        config.colorMixing = colorMixingToggle.checked;
        rerenderWithCurrentFieldGroup({ reapplyPalette: true });
    });

    greyscaleToggle.addEventListener('change', () => {
        config.greyscale = greyscaleToggle.checked;
        rerenderWithCurrentFieldGroup({ reapplyPalette: true });
    });

    modAffectSlider.addEventListener('input', () => {
        setModAffect(Number(modAffectSlider.value), false);
    });

    fieldCountMinInput.addEventListener('input', () => {
        syncFieldRange();
    });

    fieldCountMaxInput.addEventListener('input', () => {
        syncFieldRange();
    });

    resetSettingsBtn.addEventListener('click', () => {
        resetSettingsToDefaults();
    });
}

function start() {
    if (typeof modfield === 'undefined') {
        console.error('Could not load modfield bundle.');
        return;
    }

    setCellSize(DEFAULT_CELL_SIZE, true);
    setShapePadding(DEFAULT_SHAPE_PADDING, true);
    setModAffect(DEFAULT_MOD_AFFECT, true);
    syncFieldRange();
    updateConfigDisplay();
    initTheme();
    recalculateGrid();
    p5Instance = new p5(p5Sketch);

    window.setTimeout(() => {
        refresh();
        countdownTimer = window.setInterval(updateCountdown, 1000);

        regenBtn.addEventListener('click', refresh);
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            setTheme(current === 'dark' ? 'light' : 'dark');
        });

        wireConfigControls();
    }, 100);
}

document.addEventListener('DOMContentLoaded', start);
