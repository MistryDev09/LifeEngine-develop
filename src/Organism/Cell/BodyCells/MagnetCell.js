const CellStates = require("../CellStates");
const BodyCell = require("./BodyCell");
const Hyperparams = require("../../../Hyperparameters");

// offsets within a square radius, nearest first, skipping the ring right next to the magnet
const offset_cache = {};
function pullOffsets(radius) {
    if (!offset_cache[radius]) {
        var offsets = [];
        for (var dc = -radius; dc <= radius; dc++) {
            for (var dr = -radius; dr <= radius; dr++) {
                if (Math.max(Math.abs(dc), Math.abs(dr)) > 1)
                    offsets.push([dc, dr]);
            }
        }
        var dist = o => Math.max(Math.abs(o[0]), Math.abs(o[1])) * 100 + Math.abs(o[0]) + Math.abs(o[1]);
        offsets.sort((a, b) => dist(a) - dist(b));
        offset_cache[radius] = offsets;
    }
    return offset_cache[radius];
}

// Magnet: each tick, pulls loose food and mushrooms within magnetRadius one step closer to itself.
// Food stops once it is next to the magnet (or blocked); the organism still needs mouths to eat it.
// Nearest food is moved first, so a piece is only pulled once per tick by each magnet.
class MagnetCell extends BodyCell{
    constructor(org, loc_col, loc_row){
        super(CellStates.magnet, org, loc_col, loc_row);
    }

    performFunction() {
        var env = this.org.env;
        var c = this.getRealCol();
        var r = this.getRealRow();
        for (var loc of pullOffsets(Hyperparams.magnetRadius)) {
            var food_c = c + loc[0];
            var food_r = r + loc[1];
            var cell = env.grid_map.cellAt(food_c, food_r);
            if (cell == null || !CellStates.isFood(cell.state))
                continue;
            if (Math.random() >= Hyperparams.magnetPullChance)
                continue;
            var to_c = food_c - Math.sign(loc[0]);
            var to_r = food_r - Math.sign(loc[1]);
            var target = env.grid_map.cellAt(to_c, to_r);
            if (target == null || target.state != CellStates.empty)
                continue;
            var state = cell.state;
            env.changeCell(food_c, food_r, CellStates.empty, null);
            env.changeCell(to_c, to_r, state, null);
        }
    }
}

module.exports = MagnetCell;
