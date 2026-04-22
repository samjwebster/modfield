let renderGenerator;
let composition;

function getCanvasDimensions() {
    const container = document.getElementById('canvas_container');
    const nextWidth = Math.max(1, container?.clientWidth || window.innerWidth || 1);
    const nextHeight = Math.max(1, container?.clientHeight || window.innerHeight || 1);
    return { width: nextWidth, height: nextHeight };
}

function setup() {
    const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();
    const cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent('canvas_container');

    const resetButton = document.getElementById('reset-button');
    resetButton.onclick = regenerate;

    regenerate();
}

function windowResized() {
    const { width: nextWidth, height: nextHeight } = getCanvasDimensions();
    resizeCanvas(nextWidth, nextHeight);
    regenerate();
}

function regenerate() {
    granulated = false;

    let c = new Composition();
    renderGenerator = c.render();
    loop();
}

function draw() {
    let nxt = renderGenerator.next();
    if(nxt.done) {
        noLoop();
    }
}

class Composition {
    constructor() {
        return;
    }

    *render() {
        // background(240);
        colorMode(HSB);
        background(random()*360, 20, 95);
        yield;

        let sampleRes = 0.0040*min(width, height);
        let countX = ceil(width/sampleRes);
        let countY = ceil(height/sampleRes);

        let aOff = random()*TAU;
        let rRange = [0.0125 * min(width, height), 0.05 * min(width, height)];

        let xNMod = random(1);
        let yNMod = random(1);

        random()>0.5 ? xNMod *= 5 : yNMod *= 5;

        // let modulator = ceil(random(2, 5));
        // modulator = 4;
        // let modulatorOffset = random(-1, 1)*PI/2;

        // let nDetail = 0.75;
        // nDetail = 0.25;

        let nDetail = random(0.25, 1.5);

        let ptsToDo = [];

        for(let i = 0.5; i < countX; i++) {
            let ti = i/countX;
            let x = lerp(-0.01*width, 1.01*width, ti);
            for(let j = 0.5; j < countY; j++) {
                let tj = j/countY;
                let y = lerp(-0.01*height, 1.01*height, tj);
                ptsToDo.push([x, y, i, j]);
            }
        }

        let skipper = 100;

        ptsToDo = shuffleArray(ptsToDo);

        let fg = modfield.generateRandomFieldGroup({
            w: width, h: height,
        });

        let fg2 = modfield.generateRandomFieldGroup({
            w: width, h: height,
        });

        let chunk_interval = 0.33;

        for(let ix = 0; ix < ptsToDo.length; ix++) {
            let pt = ptsToDo[ix];
            let x = pt[0];
            let y = pt[1];
            let i = pt[2];
            let j = pt[3];

            // let n = noise(x/min(width,height) * nDetail * xNMod, y/min(width,height) * nDetail * yNMod, (i/countX + j/countY));
            let n = fg.mod([x, y]);
            n = fg.normalize(n);

            // let nModulatorCheck = (n*100);
            // nModulatorCheck = lerp(0, 50, n);
            // let modResult = round(nModulatorCheck) % modulator;
            // let modT = ((nModulatorCheck%modulator)-2)/(modulator-2);
            // modT = -4 * (modT - 0.5) * (modT - 0.5) + 1;

            // if(modResult <= 1) continue;

            let chunk_rem = n % chunk_interval;
            if(chunk_rem > chunk_interval * 0.10) continue;

            // if(a < modulatorOffset) lerp(a, modulatorOffset, modT);
            // else if(a > modulatorOffset) lerp(a, modulatorOffset+PI, modT);

            let n2 = fg2.mod([x, y]);
            n2 = fg2.normalize(n2);
            let a = n2 * TAU + aOff;
            
            let r = lerp(rRange[0], rRange[1], random());
            let rOffAmt = r/16;
            let pa = [x + random(-1,1)*rOffAmt + cos(a)*r/2, y + random(-1,1)*rOffAmt + sin(a)*r/2];
            let pb = [x + random(-1,1)*rOffAmt - cos(a)*r/2, y + random(-1,1)*rOffAmt - sin(a)*r/2];

            stroke(0);
            // line(...pa, ...pb);
            scribblyLine(pa, pb, color(0), ((1-chunk_rem)**2)*1.5);

            if(ix % skipper == 0) yield;
        }
    }
    
}

function nPoint(pos, radius, detail) {
    let n = noise(pos[0] * detail, pos[1] * detail);
    let angle = n * TAU;
    return [pos[0] + cos(angle)*radius, pos[1] + sin(angle)*radius];
}

function rPos(pos, amt) {
    return [pos[0] + random(-1,1)*amt, pos[1] + random(-1,1)*amt];
}

function colTrans(col, amt) {
    push();
    colorMode(RGB);
    if(amt < 1) amt *= 255;
    let c = color(red(col), green(col), blue(col), amt);
    pop();
    return c;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]; // ES6 swap
    }
    return arr;
}

function scribblyLine(a, b, col, feather) {
    density = 0.0005 * min(width, height);
    let count = ceil(dist(...a, ...b)/density);
    noStroke();
    for(let i = 0; i < count; i++) {
        let t = i/count;
        let x = lerp(a[0], b[0], t);
        let y = lerp(a[1], b[1], t);
        
        let r = lerp(0.00075*min(width,height), 0.0015*width, random());
        let p = nPoint([x, y], r, 0.01);
        p = rPos(p, feather);

        fill(colTrans(col, random(0.25, 0.75)*255));
        circle(...p, r);
    }
}