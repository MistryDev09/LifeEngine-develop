const CellStates = require("../CellStates");
const BodyCell = require("./BodyCell");
const Hyperparams = require("../../../Hyperparameters");

class ProducerCell extends BodyCell{
    constructor(org, loc_col, loc_row){
        super(CellStates.producer, org, loc_col, loc_row);
        this.org.anatomy.is_producer = true;
    }

    performFunction() {
        if (this.org.anatomy.is_mover && !Hyperparams.moversCanProduce)
            return;
        var env = this.org.env;
        var prob = Hyperparams.foodProdProb;
        var real_c = this.getRealCol();
        var real_r = this.getRealRow();
        var biome = env.grid_map.getCellBiome(real_c, real_r);
        if (biome== 'forest') {
            prob *= Hyperparams.forestBiomeFoodMultiplier; // multiply the probability of food dropping in forest biome x2
        }
        else if (biome == 'desert') {
            prob *= Hyperparams.desertBiomeFoodMultiplier; // multiply the probability of food dropping in desert biome x0.5
        }
        if (Math.random() * 100 <= prob) {
            var loc = Hyperparams.growableNeighbors[Math.floor(Math.random() * Hyperparams.growableNeighbors.length)]
            var loc_c=loc[0];
            var loc_r=loc[1];
            var cell = env.grid_map.cellAt(real_c+loc_c, real_r+loc_r);
            if (cell != null && cell.state == CellStates.empty){
                env.changeCell(real_c+loc_c, real_r+loc_r, CellStates.food, null);
                return;
            }
        }
    }
}

module.exports = ProducerCell;
