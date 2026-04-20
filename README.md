# modfield.js

A standalone JavaScript library for creative coding that combines **distance fields**, **modulators**, and **aggregators** to produce interesting, locally similar patterns. Originally developed for p5.js artworks, it now works as a pure JavaScript library.

## Core Concepts

**Modfield** combines three key components:

1. **Fields**: Distance-based functions that calculate values at any point in 2D space
  - `CircleField`, `LineField`, `SegmentField`, `RectField`, `OvalField`, `SineField`, `VortexField`, `RadialField`, `CrossField`, `CellularField`

2. **Modulators**: Transform distance values into interesting patterns
  - `ConstantModulator`, `FlippingConstantModulator`, `FalloffModulator`, `BinaryModulator`, `DecayModulator`, `StepModulator`, `SquareWaveModulator`, and more

3. **Aggregators**: Combine values from multiple fields
  - `aggregateWeightedAvg`, `aggregateWeightedMedian`, `aggregateWeightedRandom`, `aggregateAlternating`, `aggregateWeightedStdDev`, `aggregateSpread`, `aggregateMin`, `aggregateMax`

4. **FieldGroup**: Combines multiple fields with modulators and an aggregator
5. **FieldFlipGroup**: Blends two FieldGroups based on a threshold field
6. **Random generators**: Create randomized modulators and fields with configurable weights and ranges

## Installation

```bash
npm install modfield
```

## Usage

### Basic Example

```javascript
import {
  CircleField,
  ConstantModulator,
  FieldGroup,
  aggregateWeightedAvg
} from 'modfield';

// Create fields with modulators
const mod1 = new ConstantModulator(20);
const field1 = new CircleField([100, 100], mod1);
field1.weight = 1;

const mod2 = new ConstantModulator(30);
const field2 = new CircleField([200, 150], mod2);
field2.weight = 1;

// Create a field group
const group = new FieldGroup([field1, field2], aggregateWeightedAvg);

// Sample at a point
const value = group.mod([150, 125]);
const normalized = group.normalize(value);
console.log(normalized); // 0-1 normalized value
```

### With p5.js

```javascript
import {
  CircleField,
  DecayModulator,
  FieldGroup,
  aggregateWeightedAvg
} from 'modfield';

function setup() {
  createCanvas(800, 800);
  const mod = new DecayModulator(50);
  const field = new CircleField([400, 400], mod);
  const group = new FieldGroup([field]);
}

function draw() {
  loadPixels();
  for (let i = 0; i < pixels.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = floor(pixelIndex / width);
    
    const value = group.mod([x, y]);
    const normalized = group.normalize(value);
    const c = floor(normalized * 255);
    
    pixels[i] = c;
    pixels[i + 1] = c;
    pixels[i + 2] = c;
    pixels[i + 3] = 255;
  }
  updatePixels();
}
```

### Random Generation

The package also exports helpers for generating randomized fields and modulators.

```javascript
import {
  generateRandomModulator,
  generateRandomField,
  generateRandomFields,
  generateRandomFieldGroup,
  generateRandomFlipFieldGroup
} from 'modfield';

const modulator = generateRandomModulator({
  modulatorType: 'decay',
  size: 200,
  invertChance: 0.25
});

const field = generateRandomField({
  fieldType: 'circle',
  bounds: { width: 800, height: 800 },
  modulatorOptions: {
    modulatorType: 'decay'
  }
});

const fields = generateRandomFields(8, {
  bounds: { width: 800, height: 800 },
  fieldTypes: ['circle', 'rect', 'sine'],
  modulatorTypes: ['constant', 'decay', 'squareWave']
});

const group = generateRandomFieldGroup(6, {
  fieldTypes: ['circle', 'oval', 'sine'],
  aggregatorType: 'aggregateWeightedMedian'
});

const flipGroup = generateRandomFlipFieldGroup({
  groupAFieldCount: 4,
  groupBFieldCount: 5,
  thresholdRange: [0.3, 0.7]
});
```

Useful configuration knobs:

- `fieldTypes` and `modulatorTypes` limit the random selection pool
- `fieldWeights` and `modulatorWeights` bias selection toward preferred types
- `bounds` replaces the old p5.js `width` and `height` globals
- `modulatorOptions` lets you tune the nested modulator generation separately

## Available Classes

### Fields

- **CircleField**: Distance from a point (radial field)
- **LineField**: Distance from an infinite line (with optional debug rendering)
- **SegmentField**: Distance from a line segment
- **RectField**: Distance from a rectangle boundary
- **OvalField**: Distance from an oval/ellipse
- **SineField**: Distance from a sine wave
- **VortexField**: Spiral pattern field
- **RadialField**: Expanding radial band patterns
- **CrossField**: Mirrored/symmetrical distance
- **CellularField**: Voronoi-like cellular patterns

### Modulators

- **ConstantModulator**: Repeating stripes with period
- **FlippingConstantModulator**: Triangle wave pattern
- **FalloffModulator**: Distance-adaptive repeating bands
- **BinaryModulator**: On/off binary pattern
- **StepModulator**: Discrete stepped levels
- **DecayModulator**: Monotonic distance decay
- **SquareWaveModulator**: Hard on/off square wave with adjustable duty cycle

### Aggregators

- **aggregateWeightedAvg**: Weighted average (default)
- **aggregateWeightedMedian**: Weighted median
- **aggregateWeightedRandom**: Weighted random selection
- **aggregateAlternating**: Alternating pattern
- **aggregateWeightedStdDev**: Standard deviation
- **aggregateSpread**: Spread/conflict measure
- **aggregateMin**: Minimum value
- **aggregateMax**: Maximum value

### Random Generators

- **generateRandomModulator**: Creates a modulator using weighted or explicit type selection
- **generateRandomField**: Creates a field with a generated or supplied modulator
- **generateRandomFields**: Creates an array of random fields
- **generateRandomFieldGroup**: Creates a random FieldGroup with configurable fields and aggregator
- **generateRandomFlipFieldGroup**: Creates a random FieldFlipGroup with configurable branches and routing field

## API Reference

### FieldGroup

```javascript
const group = new FieldGroup(fields, aggregator = aggregateWeightedAvg);
const value = group.mod(pos);           // Get raw value at [x, y]
const normalized = group.normalize(val); // Normalize value to 0-1 range
```

### FieldFlipGroup

Blends two FieldGroups based on a flip field:

```javascript
const flipGroup = new FieldFlipGroup(groupA, groupB, flipField, threshold);
const value = flipGroup.mod(pos);              // Returns groupA or groupB value
const normalized = flipGroup.normalize(val, useB);
```

### Modulator Pattern

All modulators implement:
- `mod(distance)`: Transform a distance value
- `inverted`: Boolean flag to invert the output

## Building from Source

```bash
npm install
npm run build
```

Output files:
- `dist/modfield.es.js` - ES module build
- `dist/modfield.umd.js` - UMD build

## Utility Functions

The library exports utility helpers for common workflow patterns:

```javascript
import { dist, random, TAU } from 'modfield';

const d = dist(x1, y1, x2, y2);
const r = random(10);           // random 0-10
const angle = random(TAU);       // random full rotation
```

## License

ISC

## Acknowledgements

- Inspired by generative design and creative coding practices
- Based on techniques from [Andrew Walpole's Vite library guide](https://andrewwalpole.com/blog/use-vite-for-javascript-libraries/)