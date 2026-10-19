const CellStates = require("../CellStates");
const BodyCell = require("./BodyCell");

// Hourglass: bends time for its organism. The organism lives hourglassLifespanMultiplier times longer,
// but only acts (eats, produces, moves, reproduces) once every hourglassSlowdown ticks.
// The effect is handled in Organism.update() and Organism.lifespan(); the cell itself does nothing.
class HourglassCell extends BodyCell{
    constructor(org, loc_col, loc_row){
        super(CellStates.hourglass, org, loc_col, loc_row);
        this.org.anatomy.has_hourglass = true;
    }
}

module.exports = HourglassCell;
