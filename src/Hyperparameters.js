const Neighbors = require("./Grid/Neighbors");

const Hyperparams = {
    setDefaults: function() {
        this.lifespanMultiplier = 100;
        this.foodProdProb = 5;
        this.forestBiomeFoodMultiplier = 2; 
        this.desertBiomeFoodMultiplier = 0.5;
        this.killableNeighbors = Neighbors.adjacent;
        this.edibleNeighbors = Neighbors.adjacent;
        this.growableNeighbors = Neighbors.adjacent;

        // Life history genes. When useGlobalLifeHistory is true every organism
        // is pinned to the global* values below, which is how control runs andV
        // re-invasion tests are set up. When false the genes are inherited and
        // drift by up to lifeHistoryStep percent at every birth.
        this.useGlobalLifeHistory = false;
        this.lifeHistoryStep = 3;
        this.globalReproThreshold = 1.0;
        this.globalLifespanFactor = 1.0;
        this.globalDispersal = 1.0;

        this.useGlobalMutability = false;
        this.globalMutability = 5;
        this.addProb = 25;
        this.changeProb = 25;
        this.removeProb = 25;
        this.brainMutationChance = 25;
        this.mutationSymmetryChance = 10;
        
        this.rotationEnabled = true;

        this.foodBlocksReproduction = true;
        this.moversCanProduce = false;

        this.instaKill = false;
        this.dontKillSameSpecies = false;
        this.predatorSizeRatio = 0.5;
        this.predatorMaxPreySize = 12;
        this.covidWeight = 0.005; // mutation weight relative to a normal cell (1)
        this.covidInfectChance = 0.1; // per touching cell, per tick
        this.covidLethalFraction = 0.75; // host dies when more than this fraction of its cells are covid
        this.hourglassLifespanMultiplier = 2; // organisms with an hourglass live this many times longer...
        this.hourglassSlowdown = 2; // ...but only act once every this many ticks
        this.magnetRadius = 2; // how far a magnet cell reaches for food
        this.magnetPullChance = 0.25; // chance per food, per tick, of being pulled one step closer

        this.lookRange = 30;
        this.seeThroughSelf = false;
        this.evolveIndependentEyeDecisions = true;

        //this.foodDropProb = 0.01;
        this.foodDropProb = 0; 

        this.mushroomSpawnChance = 0.1; // chance each cell of a dead organism becomes a mushroom instead of food (0 = off)
        this.mushroomFoodValue = 3; // food gained from eating one mushroom (normal food = 1)

        this.extraMoverFoodCost = 0;

        this.maxOrganisms = -1;
    },

    loadJsonObj(obj) {
        for (let key in obj) {
            this[key] = obj[key];
        }
    }
}

Hyperparams.setDefaults();

module.exports = Hyperparams;