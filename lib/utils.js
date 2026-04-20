// Mathematical constants and utility functions
export const TAU = Math.PI * 2;

export const dist = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
};

export const radians = (degrees) => degrees * (Math.PI / 180);
export const degrees = (radians) => radians * (180 / Math.PI);

export const lerp = (a, b, t) => a + (b - a) * t;

export const constrain = (value, min_val, max_val) => {
    return Math.max(min_val, Math.min(max_val, value));
};

export const random = (arg1, arg2) => {
    if (Array.isArray(arg1)) {
        return arg1[Math.floor(Math.random() * arg1.length)];
    }
    if (arg2 !== undefined) {
        // random(min, max) form
        return arg1 + Math.random() * (arg2 - arg1);
    }
    if (arg1 !== undefined) {
        // random(max) form
        return Math.random() * arg1;
    }
    // random() form
    return Math.random();
};
