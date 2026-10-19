const CellStates = require("../CellStates");
const BodyCell = require("./BodyCell");
const Hyperparams = require("../../../Hyperparameters");

// Instantly kills adjacent organisms that are small relative to its own organism.
// Prey must be at most predatorSizeRatio * own size, and no larger than predatorMaxPreySize.
class PredatorCell extends BodyCell{
    constructor(org, loc_col, loc_row){
        super(CellStates.predator, org, loc_col, loc_row);
    }

    performFunction() {
        var env = this.org.env;
        var c = this.getRealCol();
        var r = this.getRealRow();
        for (var loc of Hyperparams.killableNeighbors) {
            var cell = env.grid_map.cellAt(c+loc[0], r+loc[1]);
            this.huntNeighbor(cell);
            if (!this.org.living)
                return;
        }
    }

    huntNeighbor(n_cell) {
        if(n_cell == null || n_cell.owner == null || n_cell.owner == this.org || !n_cell.owner.living || n_cell.state == CellStates.armor)
            return;
        if (Hyperparams.dontKillSameSpecies && n_cell.owner.species.name === this.org.species.name)
            return;
        var prey_size = n_cell.owner.anatomy.cells.length;
        var own_size = this.org.anatomy.cells.length;
        if (prey_size <= own_size * Hyperparams.predatorSizeRatio && prey_size <= Hyperparams.predatorMaxPreySize) {
            n_cell.owner.die();
        }
    }
}

module.exports = PredatorCell;
