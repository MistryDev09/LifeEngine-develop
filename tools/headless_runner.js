/*
 * Headless batch runner for life-history experiments.
 *
 * Runs the simulation without a browser so that many replicate trials can be
 * run per condition and written to CSV. The engine restarts itself on
 * extinction when it is run in the page, which makes extinction events easy to
 * miss; here each trial stops at extinction and records the tick it happened.
 *
 * Usage:
 *   node tools/headless_runner.js --trials 20 --ticks 36000 --out data/evolving.csv
 *   node tools/headless_runner.js --trials 20 --ticks 36000 --pinned --out data/control.csv
 *
 * Options:
 *   --trials N        number of replicate trials            (default 10)
 *   --ticks N         ticks per trial                       (default 36000)
 *   --interval N      ticks between CSV samples            (default 200)
 *   --pinned          disable gene inheritance (control arm)
 *   --repro F         fixed reproduction threshold when pinned   (default 1)
 *   --lifespan F      fixed lifespan factor when pinned          (default 1)
 *   --dispersal F     fixed dispersal range when pinned          (default 1)
 *   --step F          gene drift per birth, percent          (default 3)
 *   --cols N --rows N grid size                            (default 150x80)
 *   --foodprod F      producer food production probability    (default 5)
 *   --maxorg N        organism cap, -1 for none               (default -1)
 *   --lifespanmult N  ticks of life per cell                  (default 100)
 *   --label TEXT      label written into the CSV              (default none)
 *   --seed N          base RNG seed, trial t uses seed+t    (default 1)
 *   --species FILE    JSON list of seed organisms (see README)
 *   --out FILE        CSV output path                 (default stdout only)
 */

const fs = require('fs');
const pathlib = require('path');

global.alert = function (m) { throw new Error('alert: ' + m); };

// ---- deterministic RNG so a condition can be re-run exactly -----------------
function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const SRC = pathlib.join(__dirname, '..', 'src');
const Environment = require(pathlib.join(SRC, 'Environments/Environment'));
const GridMap = require(pathlib.join(SRC, 'Grid/GridMap'));
const Organism = require(pathlib.join(SRC, 'Organism/Organism'));
const CellStates = require(pathlib.join(SRC, 'Organism/Cell/CellStates'));
const Hyperparams = require(pathlib.join(SRC, 'Hyperparameters'));
const FossilRecord = require(pathlib.join(SRC, 'Stats/FossilRecord'));

// ---- argument parsing -------------------------------------------------------
function args() {
    const a = process.argv.slice(2);
    const o = {trials: 10, ticks: 36000, interval: 200, pinned: false, repro: 1,
               lifespan: 1, dispersal: 1, step: 3, cols: 150, rows: 80, seed: 1,
               species: null, out: null,
               foodprod: 5, maxorg: -1, lifespanmult: 100, label: ''};
    for (let i = 0; i < a.length; i++) {
        const k = a[i].replace(/^--/, '');
        if (k === 'pinned') { o.pinned = true; continue; }
        if (!(k in o)) { console.error('unknown option: ' + a[i]); process.exit(1); }
        const v = a[++i];
        o[k] = (typeof o[k] === 'number') ? Number(v) : v;
    }
    return o;
}

// ---- a world with no canvas and no controls --------------------------------
class HeadlessEnvironment extends Environment {
    constructor(cols, rows) {
        super();
        this.grid_map = new GridMap(cols, rows, 5);
        this.organisms = [];
        this.walls = [];
        this.total_mutability = 0;
        this.total_repro_threshold = 0;
        this.total_lifespan_factor = 0;
        this.total_dispersal = 0;
        this.largest_cell_count = 0;
        this.reset_count = 0;
        this.total_ticks = 0;
        this.data_update_rate = 100;
        FossilRecord.setEnv(this);
    }

    update() {
        const to_remove = [];
        for (const i in this.organisms) {
            const org = this.organisms[i];
            if (!org.living || !org.update()) to_remove.push(i);
        }
        this.removeOrganisms(to_remove);
        this.total_ticks++;
    }

    removeOrganisms(indices) {
        for (const i of indices.reverse()) {
            this.total_mutability -= this.organisms[i].mutability;
            this.total_repro_threshold -= this.organisms[i].repro_threshold;
            this.total_lifespan_factor -= this.organisms[i].lifespan_factor;
            this.total_dispersal -= this.organisms[i].dispersal;
            this.organisms.splice(i, 1);
        }
    }

    addOrganism(organism) {
        organism.updateGrid();
        this.total_mutability += organism.mutability;
        this.total_repro_threshold += organism.repro_threshold;
        this.total_lifespan_factor += organism.lifespan_factor;
        this.total_dispersal += organism.dispersal;
        this.organisms.push(organism);
        if (organism.anatomy.cells.length > this.largest_cell_count)
            this.largest_cell_count = organism.anatomy.cells.length;
    }

    canAddOrganism() {
        return Hyperparams.maxOrganisms < 0 || this.organisms.length < Hyperparams.maxOrganisms;
    }

    averageMutability() {
        if (this.organisms.length < 1) return 0;
        if (Hyperparams.useGlobalMutability) return Hyperparams.globalMutability;
        return this.total_mutability / this.organisms.length;
    }

    averageLifeHistory() {
        if (Hyperparams.useGlobalLifeHistory) {
            return {repro_threshold: Number(Hyperparams.globalReproThreshold),
                    lifespan_factor: Number(Hyperparams.globalLifespanFactor),
                    dispersal: Number(Hyperparams.globalDispersal)};
        }
        if (this.organisms.length < 1) return {repro_threshold: 0, lifespan_factor: 0, dispersal: 0};
        return {repro_threshold: this.total_repro_threshold / this.organisms.length,
                lifespan_factor: this.total_lifespan_factor / this.organisms.length,
                dispersal: this.total_dispersal / this.organisms.length};
    }
}

// default seed is the engine's own origin of life: one mouth, two producers
const DEFAULT_SPECIES = [{count: 1, cells: [['mouth', 0, 0], ['producer', 1, 1], ['producer', -1, -1]]}];

function seedWorld(env, spec) {
    for (const entry of spec) {
        for (let n = 0; n < (entry.count || 1); n++) {
            let placed = false;
            for (let attempt = 0; attempt < 500 && !placed; attempt++) {
                const c = Math.floor(Math.random() * env.grid_map.cols);
                const r = Math.floor(Math.random() * env.grid_map.rows);
                const org = new Organism(c, r, env);
                for (const [name, col, row] of entry.cells) {
                    if (!CellStates[name]) throw new Error('unknown cell type: ' + name);
                    org.anatomy.addDefaultCell(CellStates[name], col, row);
                }
                if (org.isClear(c, r, org.rotation)) {
                    env.addOrganism(org);
                    FossilRecord.addSpecies(org, null);
                    placed = true;
                }
            }
            if (!placed) console.error('warning: could not place a seed organism');
        }
    }
}

function runTrial(trial, opt, spec, rows) {
    Math.random = mulberry32(opt.seed + trial);
    Hyperparams.setDefaults();
    Hyperparams.useGlobalLifeHistory = opt.pinned;
    Hyperparams.lifeHistoryStep = opt.step;
    Hyperparams.foodProdProb = opt.foodprod;
    Hyperparams.maxOrganisms = opt.maxorg;
    Hyperparams.lifespanMultiplier = opt.lifespanmult;
    Hyperparams.globalReproThreshold = opt.repro;
    Hyperparams.globalLifespanFactor = opt.lifespan;
    Hyperparams.globalDispersal = opt.dispersal;
    FossilRecord.init();

    const env = new HeadlessEnvironment(opt.cols, opt.rows);
    seedWorld(env, spec);

    let extinct_at = '';
    let peak_pop = env.organisms.length;
    let peak_tick = 0;
    for (let t = 1; t <= opt.ticks; t++) {
        env.update();
        if (env.organisms.length > peak_pop) { peak_pop = env.organisms.length; peak_tick = t; }
        if (t % opt.interval === 0 || env.organisms.length === 0) {
            const lh = env.averageLifeHistory();
            rows.push([opt.label, trial, t, env.organisms.length, FossilRecord.numExtantSpecies(),
                       lh.repro_threshold.toFixed(5), lh.lifespan_factor.toFixed(5),
                       lh.dispersal.toFixed(5), env.averageMutability().toFixed(3)].join(','));
        }
        if (env.organisms.length === 0) { extinct_at = t; break; }
    }
    const lh = env.averageLifeHistory();
    return {trial: trial, extinct_at: extinct_at, final_pop: env.organisms.length,
            peak_pop: peak_pop, peak_tick: peak_tick, lh: lh};
}

function main() {
    const opt = args();
    const spec = opt.species ? JSON.parse(fs.readFileSync(opt.species, 'utf8')) : DEFAULT_SPECIES;
    const rows = ['label,trial,tick,population,species,repro_threshold,lifespan_factor,dispersal,mutability'];
    const summaries = [];

    console.log('condition: ' + (opt.pinned ? 'PINNED (control)' : 'EVOLVING')
        + '  trials=' + opt.trials + '  ticks=' + opt.ticks + '  grid=' + opt.cols + 'x' + opt.rows);
    console.log('trial\textinct_at\tfinal_pop\tpeak_pop\tpeak_tick\trepro\tlifespan\tdispersal');

    for (let t = 0; t < opt.trials; t++) {
        const s = runTrial(t, opt, spec, rows);
        summaries.push(s);
        console.log([s.trial, s.extinct_at === '' ? 'survived' : s.extinct_at, s.final_pop,
                     s.peak_pop, s.peak_tick, s.lh.repro_threshold.toFixed(4),
                     s.lh.lifespan_factor.toFixed(4), s.lh.dispersal.toFixed(4)].join('\t'));
    }

    const extinctions = summaries.filter(s => s.extinct_at !== '').length;
    console.log('\nextinction in ' + extinctions + '/' + opt.trials + ' trials');
    const survivors = summaries.filter(s => s.extinct_at === '');
    if (survivors.length) {
        const mean = k => survivors.reduce((a, s) => a + s.lh[k], 0) / survivors.length;
        console.log('surviving-population gene means: repro=' + mean('repro_threshold').toFixed(4)
            + ' lifespan=' + mean('lifespan_factor').toFixed(4)
            + ' dispersal=' + mean('dispersal').toFixed(4));
    }

    if (opt.out) {
        fs.mkdirSync(pathlib.dirname(opt.out), {recursive: true});
        fs.writeFileSync(opt.out, rows.join('\n') + '\n');
        console.log('wrote ' + (rows.length - 1) + ' samples to ' + opt.out);
    }
}

main();
