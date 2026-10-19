const CellStates = require("../CellStates");
const BodyCell = require("./BodyCell");
const Hyperparams = require("../../../Hyperparameters");

// Covid-19: a pure parasite. Does nothing for its host, but each tick it may convert
// a touching cell of another organism into a covid cell, destroying that cell's function.
// Infected organisms pass it on to their offspring, since children copy the parent's anatomy.
class CovidCell extends BodyCell{
    constructor(org, loc_col, loc_row){
        super(CellStates.covid, org, loc_col, loc_row);
    }

    performFunction() {
        var env = this.org.env;
        var c = this.getRealCol();
        var r = this.getRealRow();
        for (var loc of Hyperparams.killableNeighbors) {
            var cell = env.grid_map.cellAt(c+loc[0], r+loc[1]);
            this.infectNeighbor(cell, env);
        }
    }

    infectNeighbor(n_cell, env) {
        if (n_cell == null || n_cell.owner == null || n_cell.owner == this.org || !n_cell.owner.living || n_cell.state == CellStates.covid)
            return;
        if (Math.random() >= Hyperparams.covidInfectChance)
            return;
        var victim = n_cell.owner;
        var body_cell = n_cell.cell_owner;
        var new_cell = victim.anatomy.replaceCell(CellStates.covid, body_cell.loc_col, body_cell.loc_row, false);
        env.changeCell(n_cell.col, n_cell.row, CellStates.covid, new_cell);
    }
}

module.exports = CovidCell;
