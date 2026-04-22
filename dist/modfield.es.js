//#region lib/utils.js
var e = Math.PI * 2, t = (e, t, n, r) => {
	let i = n - e, a = r - t;
	return Math.sqrt(i * i + a * a);
}, n = (e) => Math.PI / 180 * e, r = (e) => 180 / Math.PI * e, i = (e, t, n) => e + (t - e) * n, a = (e, t, n) => Math.max(t, Math.min(n, e)), o = (e, t) => Array.isArray(e) ? e[Math.floor(Math.random() * e.length)] : t === void 0 ? e === void 0 ? Math.random() : Math.random() * e : e + Math.random() * (t - e), s = class {
	constructor(e, t) {
		this.pos = e, this.modulator = t, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		return t(...this.pos, ...e);
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, c = class {
	constructor(e, t, n) {
		this.pos = e, this.slope = t, this.modulator = n, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		let [t, n] = e, [r, i] = this.pos, a = this.slope, o = a, s = i - a * r;
		return Math.abs(o * t + -1 * n + s) / Math.sqrt(o * o + 1);
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, l = class {
	constructor(e, t, n) {
		this.posA = e, this.posB = t, this.modulator = n, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		let [n, r] = e, [i, a] = this.posA, [o, s] = this.posB, c = n - i, l = r - a, u = o - i, d = s - a, f = c * u + l * d, p = u * u + d * d, m = -1;
		p != 0 && (m = f / p);
		let h, g;
		return m < 0 ? (h = i, g = a) : m > 1 ? (h = o, g = s) : (h = i + m * u, g = a + m * d), t(n, r, h, g);
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, u = class {
	constructor(e, t, n, r) {
		this.pos = e, this.w = t, this.h = n, this.modulator = r, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		let [t, n] = e, [r, i] = this.pos, a = Math.max(Math.abs(t - r) - this.w / 2, 0), o = Math.max(Math.abs(n - i) - this.h / 2, 0);
		return Math.sqrt(a * a + o * o);
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, d = class {
	constructor(e, t, n, r) {
		this.pos = e, this.w = t, this.h = n, this.modulator = r, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		let [t, n] = e, [r, i] = this.pos, a = t - r, o = n - i;
		return Math.sqrt(a * a / (this.w * this.w) + o * o / (this.h * this.h)) * Math.min(this.w, this.h);
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, f = class {
	constructor(t, r, i, a, o) {
		this.pos = t, this.freq = r, this.angle = Math.abs(i) <= e ? i : n(i), this.cosAngle = Math.cos(this.angle), this.sinAngle = Math.sin(this.angle), this.amplitude = a, this.modulator = o, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		let [t, n] = e, [r, i] = this.pos, a = t - r, o = n - i, s = a * this.cosAngle + o * this.sinAngle, c = -a * this.sinAngle + o * this.cosAngle, l = Math.sin(s * this.freq) * this.amplitude;
		return Math.abs(c - l);
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, p = class {
	constructor(e, t, n, r = 100) {
		this.pos = e, this.turnRate = t, this.modulator = n, this.scale = r, this.weight = 1, this.bounds = null;
	}
	dist(t) {
		let [n, r] = t, [i, a] = this.pos, o = n - i, s = r - a, c = Math.sqrt(o * o + s * s), l = (Math.atan2(s, o) + Math.PI) / e * this.turnRate * this.scale;
		return Math.abs(c - l);
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, m = class {
	constructor(e, t, n, r) {
		this.pos = e, this.waveSpacing = t, this.wobble = n, this.modulator = r, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		let [t, n] = e, [r, i] = this.pos, a = t - r, o = n - i, s = Math.sqrt(a * a + o * o) / Math.max(this.waveSpacing, 1e-4), c = Math.abs(s % 1 - .5) * 2, l = Math.abs(Math.sin(Math.atan2(o, a) * 3)) * this.wobble;
		return Math.abs(c + l);
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, h = class {
	constructor(e, t, n) {
		this.pos = e, this.axisAngle = t, this.modulator = n, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		let [t, n] = e, [r, i] = this.pos, a = t - r, o = n - i, s = this.axisAngle, c = Math.cos(s), l = Math.sin(s), u = a * c + o * l, d = -a * l + o * c;
		return Math.min(Math.abs(d), Math.abs(u));
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, g = class {
	constructor(e, t, n = 100) {
		this.seedPoints = e, this.seedRadii = e.map(() => o(.5, 1.5) * n * .1), this.modulator = t, this.scale = n, this.weight = 1, this.bounds = null;
	}
	dist(e) {
		let n = Infinity;
		for (let r = 0; r < this.seedPoints.length; r++) {
			let i = this.seedPoints[r], a = this.seedRadii[r], o = .15 * this.scale * Math.sin(r * 12.9898 + i[0] * .01 + i[1] * .02), s = i[0] + o * .25, c = i[1] + o * .25, l = Math.abs(t(e[0], e[1], s, c) - a);
			n = Math.min(n, l);
		}
		return n;
	}
	mod(e, t = !0) {
		let n = t ? Math.round(this.dist(e)) : this.dist(e);
		return this.modulator.mod(n);
	}
}, _ = class {
	constructor(e) {
		this.val = e, this.inverted = !1;
	}
	mod(e) {
		let t = e % this.val / this.val;
		return this.inverted && (t = 1 - t), t;
	}
}, v = class {
	constructor(e) {
		this.val = e, this.inverted = !1;
	}
	mod(e) {
		let t = Math.floor(e / this.val), n = e % this.val / this.val;
		return this.inverted && (n = 1 - n), t % 2 == 0 ? n : 1 - n;
	}
}, y = class {
	constructor(e, t) {
		this.val = e, this.rate = t, this.inverted = !1;
	}
	mod(e) {
		let t = 1 + e / this.val, n = this.val * (t * this.rate), r = e % n / n;
		return this.inverted && (r = 1 - r), r;
	}
}, b = class {
	constructor(e) {
		this.val = e, this.inverted = !1;
	}
	mod(e) {
		let t = Math.floor(e / this.val) % 2;
		return this.inverted && (t = 1 - t), t;
	}
}, x = class {
	constructor(e, t) {
		this.stepSize = e, this.numSteps = t || 5, this.inverted = !1;
	}
	mod(e) {
		let t = Math.floor(e / this.stepSize) % this.numSteps / this.numSteps;
		return this.inverted && (t = 1 - t), t;
	}
}, S = class {
	constructor(e, t = .5) {
		this.period = e, this.dutyCycle = t, this.inverted = !1;
	}
	mod(e) {
		let t = +(e % this.period / this.period < this.dutyCycle);
		return this.inverted && (t = 1 - t), t;
	}
}, C = class {
	constructor(e) {
		this.decayScale = e, this.inverted = !1;
	}
	mod(e) {
		let t = 1 / (1 + e / this.decayScale);
		return this.inverted && (t = 1 - t), t;
	}
};
//#endregion
//#region lib/aggregators.js
function w(e, t) {
	let n = 0, r = 0;
	for (let i = 0; i < e.length; i++) n += e[i] * t[i], r += t[i];
	return n / r;
}
function T(e, t) {
	return e = e.map((e, n) => e * (t[n] ?? 1)), Math.min(...e);
}
function E(e, t) {
	return e = e.map((e, n) => e * (t[n] ?? 1)), Math.max(...e);
}
function D(e, t) {
	let n = o(t.reduce((e, t) => e + t, 0)), r = 0;
	for (let i = 0; i < e.length; i++) if (r += t[i], r >= n) return e[i];
	return o(e);
}
function O(e, t) {
	let n = e.map((e, n) => ({
		val: e,
		weight: t[n]
	}));
	n.sort((e, t) => e.val - t.val);
	let r = 0, i = t.reduce((e, t) => e + t, 0);
	for (let e of n) if (r += e.weight, r >= i / 2) return e.val;
	return n[n.length - 1].val;
}
function k(e, t) {
	let n = 0, r = 0;
	for (let i = 0; i < e.length; i++) i % 2 == 0 ? n += e[i] * t[i] : r += t[i];
	return r > 0 ? n / r : Math.min(...e);
}
function A(e, t) {
	let n = w(e, t), r = 0, i = 0;
	for (let a = 0; a < e.length; a++) r += t[a] * (e[a] - n) ** 2, i += t[a];
	return Math.sqrt(r / i);
}
function j(e, t) {
	return e.length === 0 ? 0 : (e = e.map((e, n) => e * (t[n] ?? 1)), Math.max(...e) - Math.min(...e));
}
//#endregion
//#region lib/modfield.js
var M = 1e3;
function N(e) {
	M = e;
}
var P = class {
	constructor(e, t = w) {
		this.fields = e, this.bounds = e[0].bounds, this.aggregator = t, this.normalize_mode = "pcts", this.minSeen = Infinity, this.maxSeen = -Infinity, this.fifthPct = 0, this.ninetyFifthPct = 1, this.warm();
	}
	warm() {
		let e = [];
		if (this.bounds == null) {
			console.log("Cannot warm a FieldGroup with unknown bounds.");
			return;
		}
		for (let t = 0; t < M; t++) {
			let t = Math.random() * this.bounds.width, n = Math.random() * this.bounds.height;
			e.push(this.mod([t, n]));
		}
		let t = e.reduce((e, t) => e + t, 0) / e.length, n = e.reduce((e, n) => e + (n - t) ** 2, 0) / e.length, r = Math.sqrt(n);
		this.fifthPct = t - 1.645 * r, this.ninetyFifthPct = t + 1.645 * r;
	}
	mod(e) {
		let t = [], n = [];
		for (let r of this.fields) t.push(r.mod(e)), n.push(r.weight);
		let r = this.aggregator(t, n);
		return this.minSeen = Math.min(this.minSeen, r), this.maxSeen = Math.max(this.maxSeen, r), r;
	}
	normalize(e) {
		return this.normalize_mode === "pcts" ? this.normalize_pcts(e) : this.normalize_minmax(e);
	}
	normalize_minmax(e) {
		let t = this.maxSeen - this.minSeen;
		if (!Number.isFinite(t) || t === 0) return .5;
		let n = (e - this.minSeen) / t;
		return Number.isFinite(n) ? n : .5;
	}
	normalize_pcts(e) {
		let t = this.ninetyFifthPct - this.fifthPct;
		if (!Number.isFinite(t) || t === 0) return .5;
		let n = (e - this.fifthPct) / t;
		return Number.isFinite(n) ? n : .5;
	}
}, F = class {
	constructor(e, t, n, r, i) {
		this.groupA = e, this.groupB = t, this.flipField = n, this.threshold = r, this.aggregator = i;
	}
	mod(e) {
		return this.flipField.mod(e) > this.threshold ? this.groupB.mod(e) : this.groupA.mod(e);
	}
	normalize(e, t) {
		return t ? this.groupB.normalize(e) : this.groupA.normalize(e);
	}
}, I = {
	aggregateWeightedAvg: 1.5,
	aggregateWeightedMedian: .5,
	aggregateSpread: .5,
	aggregateAlternating: .5,
	aggregateWeightedStdDev: .5,
	aggregateMin: .1,
	aggregateMax: .1,
	aggregateWeightedRandom: .01
}, L = {
	constant: 1.2,
	flippingConstant: .66,
	falloff: .75,
	binary: .2,
	decay: .2,
	step: .33,
	squareWave: .25
}, R = {
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
}, z = {
	1: "constant",
	2: "flippingConstant",
	3: "falloff",
	4: "binary",
	5: "decay",
	6: "step",
	7: "squareWave"
}, B = {
	1: "line",
	2: "segment",
	3: "circle",
	4: "oval",
	5: "rect",
	6: "sine",
	7: "vortex",
	8: "radial",
	9: "mirror",
	10: "cellular"
}, V = {
	aggregateWeightedAvg: w,
	aggregateMin: T,
	aggregateMax: E,
	aggregateWeightedRandom: D,
	aggregateWeightedMedian: O,
	aggregateAlternating: k,
	aggregateWeightedStdDev: A,
	aggregateSpread: j
}, H = {
	constant: (e) => new _(e),
	flippingConstant: (e) => new v(e),
	falloff: (e, t) => new y(e, t.rate),
	binary: (e) => new b(e),
	decay: (e) => new C(e),
	step: (e, t) => new x(e, t.numSteps),
	squareWave: (e, t) => new S(e, t.dutyCycle)
}, U = {
	line: (e, t) => new c(e, t.slope, t.modulator),
	segment: (e, t) => new l(e, t.endPosition, t.modulator),
	circle: (e, t) => new s(e, t.modulator),
	oval: (e, t) => new d(e, t.width, t.height, t.modulator),
	rect: (e, t) => new u(e, t.width, t.height, t.modulator),
	sine: (e, t) => new f(e, t.frequency, t.angle, t.amplitude, t.modulator),
	vortex: (e, t) => new p(e, t.turnRate, t.modulator, t.scale),
	radial: (e, t) => new m(e, t.waveSpacing, t.wobble, t.modulator),
	mirror: (e, t) => new h(e, t.axisAngle, t.modulator),
	cellular: (e, t) => new g(t.seedPoints, t.modulator, t.scale)
};
function W(e, t) {
	return e == null ? null : t[e] ?? e;
}
function G(e, t) {
	let n = t.map((t) => ({
		choice: t,
		weight: e[t] ?? 1
	})), r = n.reduce((e, t) => e + t.weight, 0);
	if (r <= 0) return t[0];
	let i = o() * r;
	for (let e of n) if (i -= e.weight, i <= 0) return e.choice;
	return t[t.length - 1];
}
function K(e, t) {
	return e == null ? null : t[e] ?? e;
}
function q(e = {}) {
	let { aggregatorTypes: t = Object.keys(I), aggregatorWeights: n = I } = e;
	return V[G(n, t.map((e) => K(e, V)))] ?? w;
}
function J(e, t = .25, n = [[-3, -.5], [1.5, 3]]) {
	let r = Math.max(e.width, e.height), i = [o(e.width), o(e.height)];
	if (o() < t) {
		let e = o(n[0][0], n[0][1]), t = o(n[1][0], n[1][1]);
		i = [o([e * r, o(1.5, 3) * r]), o([t * r, o(1.5, 3) * r])];
	}
	return i;
}
function Y(e, t) {
	let n = [];
	for (let r = 0; r < t; r += 1) n.push([o(e.width), o(e.height)]);
	return n;
}
function X(e = {}) {
	let { scale: t = null, modulatorTypes: n = Object.keys(L), modulatorWeights: r = L, modRange: i = [.01, 1], modAffect: a = 1, invertChance: s = .5, falloffRateRange: c = [.01, .05], stepNumStepsRange: l = [5, 20], squarePeakSize: u = [.35, .7] } = e;
	if (t == null) throw Error("Cannot generate a random modulator without a scale specified (designed to be min(width, height) of the viewing space). Please provide 'scale' in the modulatorOptions.");
	let d = G(r, n.map((e) => W(e, z))), f = o(i[0], i[1]) * t * a, p = Math.round(f), m;
	return m = d === "falloff" ? H.falloff(p, { rate: o(...c) }) : d === "step" ? H.step(p, { numSteps: Math.floor(o(...l)) }) : d === "squareWave" ? H.squareWave(p, { dutyCycle: o(...u) }) : (H[d] ?? H.constant)(p), m.inverted = o() < s, m;
}
function Z(t = {}, n = {}) {
	let { bounds: r = null, scale: i = Math.min(r.width, r.height), fieldTypes: a = Object.keys(R), fieldWeights: s = R, outsideChance: c = .25, outsideRange: l = [[-3, -.5], [1.5, 3]], weightRange: u = [0, 1], lineSlopeRange: d = [-e, e], widthRange: f = [.1, .25], heightRange: p = [.1, .25], sineFrequencyRange: m = [.0075, .0125], sineAmplitudeRange: h = [.25, .5], vortexTurnRateRange: g = [.05, 3], radialSpacingRange: _ = [.0125, .075], radialWobbleRange: v = [0, .1], cellularSeedCountRange: y = [3, 10] } = t;
	if (r == null) throw Error("Cannot generate a random field without bounds specified. Please provide 'bounds' in the fieldOptions.");
	let b = G(s, a.map((e) => W(e, B))), x = J(r, c, l), S = {
		modulator: X({
			scale: i,
			...n
		}),
		scale: i
	}, C;
	if (b === "line") C = U.line(x, {
		...S,
		slope: o(...d)
	});
	else if (b === "segment") C = U.segment(x, {
		...S,
		endPosition: [o(r.width), o(r.height)]
	});
	else if (b === "circle") C = U.circle(x, S);
	else if (b === "oval" || b === "rect") {
		let e = o(...f) * i, t = o(...p) * i;
		C = U[b](x, {
			...S,
			width: e,
			height: t
		});
	} else if (b === "sine") C = U.sine(x, {
		...S,
		frequency: o(...m),
		angle: o() * e,
		amplitude: o(...h) * i
	});
	else if (b === "vortex") C = U.vortex(x, {
		...S,
		turnRate: o(...g)
	});
	else if (b === "radial") C = U.radial(x, {
		...S,
		waveSpacing: o(..._) * i,
		wobble: o(...v) * i
	});
	else if (b === "mirror") C = U.mirror(x, {
		...S,
		axisAngle: o() * e
	});
	else if (b === "cellular") {
		let e = Math.floor(o(...y));
		C = U.cellular(x, {
			...S,
			seedPoints: Y(r, e)
		});
	} else C = U.circle(x, S);
	return C.bounds = r, C.weight = o(...u), C;
}
function Q(e, t = {}, n = {}) {
	let r = [];
	for (let i = 0; i < e; i += 1) r.push(Z(t, n));
	return r;
}
function $(e = {}) {
	let { w: t = null, h: n = null, fieldCountRange: r = [4, 8], aggregatorOptions: i = {}, fieldOptions: a = {}, modulatorOptions: s = {} } = e;
	if (t === null || n === null) throw Error("Cannot generate a random field group without width and height specified. Please provide 'w' and 'h' in the groupOptions.");
	let c = {
		width: t,
		height: n
	};
	a.bounds = c, s.bounds = c;
	let l = Q(Math.floor(o(...r)), a, s), { aggregatorTypes: u = Object.keys(I), aggregatorWeights: d = I } = i;
	return new P(l, q(i));
}
function ee(e = {}) {
	let { w: t = null, h: n = null, groupAFieldCountRange: r = [4, 8], groupAFieldOptions: i = {}, groupAModulatorOptions: a = {}, groupAAggregatorOptions: s = {}, groupBFieldCountRange: c = [4, 8], groupBFieldOptions: l = {}, groupBModulatorOptions: u = {}, groupBAggregatorOptions: d = {}, flipFieldOptions: f = {}, flipFieldModulatorOptions: p = {}, flipFieldThresholdRange: m = [.25, .75] } = e;
	return new F($({
		w: t,
		h: n,
		fieldCountRange: r,
		aggregatorOptions: s,
		fieldOptions: i,
		modulatorOptions: a
	}), $({
		w: t,
		h: n,
		fieldCountRange: c,
		aggregatorOptions: d,
		fieldOptions: l,
		modulatorOptions: u
	}), Z({
		bounds: {
			width: t,
			height: n
		},
		...f,
		modulatorOptions: {
			bounds: {
				width: t,
				height: n
			},
			...p
		}
	}), o(thresholdRange[0], thresholdRange[1]), resolvedAggregator);
}
//#endregion
export { b as BinaryModulator, g as CellularField, s as CircleField, _ as ConstantModulator, h as CrossField, I as DEFAULT_AGGREGATOR_WEIGHTS, R as DEFAULT_FIELD_WEIGHTS, L as DEFAULT_MODULATOR_WEIGHTS, C as DecayModulator, y as FalloffModulator, F as FieldFlipGroup, P as FieldGroup, v as FlippingConstantModulator, c as LineField, d as OvalField, m as RadialField, u as RectField, l as SegmentField, f as SineField, S as SquareWaveModulator, x as StepModulator, e as TAU, p as VortexField, k as aggregateAlternating, E as aggregateMax, T as aggregateMin, j as aggregateSpread, w as aggregateWeightedAvg, O as aggregateWeightedMedian, D as aggregateWeightedRandom, A as aggregateWeightedStdDev, a as constrain, r as degrees, t as dist, Z as generateRandomField, $ as generateRandomFieldGroup, Q as generateRandomFields, ee as generateRandomFlipFieldGroup, X as generateRandomModulator, i as lerp, n as radians, o as random, N as setWarmingSteps, M as warmingSteps };
