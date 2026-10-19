const Hyperparams = require("../../Hyperparameters");

// A cell state is used to differentiate type and render the cell
class CellState{
    constructor(name) {
        this.name = name;
        this.color = 'black';
        this.weight = 1; // relative chance of being picked by mutation
    }

    render(ctx, cell, size) {
        ctx.fillStyle = this.color;
        ctx.fillRect(cell.x, cell.y, size, size);
    }
}

class Empty extends CellState {
    constructor() {
        super('empty');
    }
}
class Food extends CellState {
    constructor() {
        super('food');
    }
}
// Rich food that sometimes grows where an organism died. Worth Hyperparams.mushroomFoodValue food.
// R = cap (scheme color), W = spot, S = stem, B = eye, . = background
const MUSHROOM_SPRITE = [
    "..RWWR..",
    ".RRWWRR.",
    "RWRRRRWR",
    "WWRRRRWW",
    "RRRRRRRR",
    ".SBSSBS.",
    ".SBSSBS.",
    "..SSSS..",
];
class Mushroom extends CellState {
    constructor() {
        super('mushroom');
        this.spot_color = 'white';
        this.stem_color = '#F2E2C4';
        this.eye_color = 'black';
    }
    render(ctx, cell, size) {
        if (size < 3) {
            ctx.fillStyle = this.color;
            ctx.fillRect(cell.x, cell.y, size, size);
            return;
        }
        ctx.fillStyle = CellStates.empty.color;
        ctx.fillRect(cell.x, cell.y, size, size);
        if (size < 8) {
            // simplified: cap on top with two spots, stem below
            var cap_h = Math.ceil(size * 0.6);
            ctx.fillStyle = this.color;
            ctx.fillRect(cell.x, cell.y, size, cap_h);
            ctx.fillStyle = this.spot_color;
            ctx.fillRect(cell.x + 1, cell.y + 1, 1, 1);
            ctx.fillRect(cell.x + size - 2, cell.y + 1, 1, 1);
            ctx.fillStyle = this.stem_color;
            var stem_w = Math.max(1, Math.round(size * 0.4));
            ctx.fillRect(cell.x + Math.round((size - stem_w) / 2), cell.y + cap_h, stem_w, size - cap_h);
            return;
        }
        // full pixel-art mushroom
        var px = size / 8;
        var colors = {R: this.color, W: this.spot_color, S: this.stem_color, B: this.eye_color};
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
                var color = colors[MUSHROOM_SPRITE[row][col]];
                if (!color) continue;
                ctx.fillStyle = color;
                ctx.fillRect(Math.floor(cell.x + col*px), Math.floor(cell.y + row*px), Math.ceil(px), Math.ceil(px));
            }
        }
    }
}
class Wall extends CellState {
    constructor() {
        super('wall');
    }
}
class Mouth extends CellState {
    constructor() {
        super('mouth');
    }
}
class Producer extends CellState {
    constructor() {
        super('producer');
    }
}
class Mover extends CellState {
    constructor() {
        super('mover');
    }
}
class Killer extends CellState {
    constructor() {
        super('killer');
    }
}
class Armor extends CellState {
    constructor() {
        super('armor');
    }
}
class Predator extends CellState {
    constructor() {
        super('predator');
    }
}
class Covid extends CellState {
    constructor() {
        super('covid');
    }
    // rarity is tunable from Hyperparameters
    get weight() { return Hyperparams.covidWeight; }
    set weight(w) {}
}
// draws a 5x5 sprite scaled to the cell; letters map to colors, '.' shows the empty background
function renderSprite(ctx, cell, size, sprite, colors) {
    ctx.fillStyle = CellStates.empty.color;
    ctx.fillRect(cell.x, cell.y, size, size);
    var px = size / sprite.length;
    for (var row = 0; row < sprite.length; row++) {
        for (var col = 0; col < sprite[row].length; col++) {
            var color = colors[sprite[row][col]];
            if (!color) continue;
            ctx.fillStyle = color;
            ctx.fillRect(Math.floor(cell.x + col*px), Math.floor(cell.y + row*px), Math.ceil(px), Math.ceil(px));
        }
    }
}
const HOURGLASS_SPRITE = ["FFFFF", ".CCC.", "..C..", ".CCC.", "FFFFF"];
class Hourglass extends CellState {
    constructor() {
        super('hourglass');
        this.frame_color = '#8A6A3A';
    }
    render(ctx, cell, size) {
        if (size < 5) return super.render(ctx, cell, size);
        renderSprite(ctx, cell, size, HOURGLASS_SPRITE, {C: this.color, F: this.frame_color});
    }
}
const MAGNET_SPRITE = ["T...T", "M...M", "M...M", "MMMMM", ".MMM."];
class Magnet extends CellState {
    constructor() {
        super('magnet');
        this.tip_color = '#D9D9D9';
    }
    render(ctx, cell, size) {
        if (size < 5) return super.render(ctx, cell, size);
        renderSprite(ctx, cell, size, MAGNET_SPRITE, {M: this.color, T: this.tip_color});
    }
}
class Eye extends CellState {
    constructor() {
        super('eye');
        this.slit_color = 'black';
    }
    render(ctx, cell, size) {
        ctx.fillStyle = this.color;
        ctx.fillRect(cell.x, cell.y, size, size);
        if(size <= 1)
            return;
        var half = size/2;
        var x = -(size)/8
        var y = -half;
        var h = size/2 + size/4;
        var w = size/4;
        ctx.translate(cell.x+half, cell.y+half);
        ctx.rotate((cell.cell_owner.getAbsoluteDirection() * 90) * Math.PI / 180);
        ctx.fillStyle = this.slit_color;
        ctx.fillRect(x, y, w, h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

const CellStates = {
    empty: new Empty(),
    food: new Food(),
    mushroom: new Mushroom(),
    wall: new Wall(),
    mouth: new Mouth(),
    producer: new Producer(),
    mover: new Mover(),
    killer: new Killer(),
    armor: new Armor(),
    eye: new Eye(),
    predator: new Predator(),
    covid: new Covid(),
    hourglass: new Hourglass(),
    magnet: new Magnet(),
    defineLists() {
        this.all = [this.empty, this.food, this.mushroom, this.wall, this.mouth, this.producer, this.mover, this.killer, this.armor, this.eye, this.predator, this.covid, this.hourglass, this.magnet]
        this.living = [this.mouth, this.producer, this.mover, this.killer, this.armor, this.eye, this.predator, this.covid, this.hourglass, this.magnet];
    },
    isFood: function(state) {
        return state === this.food || state === this.mushroom;
    },
    getRandomName: function() {
        return this.all[Math.floor(Math.random() * this.all.length)].name;
    },
    getRandomLivingType: function() {
        // weighted pick: each type's chance is proportional to its weight
        let total = 0;
        for (const c of this.living) total += c.weight;
        let roll = Math.random() * total;
        for (const c of this.living) {
            roll -= c.weight;
            if (roll < 0) return c;
        }
        return this.living[this.living.length - 1]; // floating-point safety net
    }
}

CellStates.defineLists();

module.exports = CellStates;
