const CellStates = require("../Organism/Cell/CellStates");

// Records covid events for experiments.
// An outbreak starts when the number of infected organisms goes from 0 to 1 or more,
// and ends when it returns to 0. Data is kept across world resets (see `world`) until cleared.
const CovidStats = {
    sample_rate: 100, // ticks between time series samples
    max_samples: 100000,

    setEnv(env) {
        this.env = env;
        this.clear();
    },

    // wipe all recorded data
    clear() {
        this.world = 1;
        this.outbreaks = [];
        this.series = [];
        this.resetCounters();
    },

    resetCounters() {
        this.appearances = 0; // infected newborns created by mutation
        this.infections = 0;  // cells converted by contact
        this.deaths = 0;      // hosts killed for passing covidLethalFraction
        this.infected = 0;    // organisms currently carrying covid
        this.current = null;  // the outbreak in progress, if any
    },

    // called when the world is reset: close any open outbreak and start a new world number.
    // An auto reset happens once every organism has died, so an empty world means extinction.
    worldReset() {
        this.endOutbreak(this.env.organisms.length === 0 ? 'extinction' : 'manual reset');
        this.resetCounters();
        this.world++;
    },

    startOutbreak(source) {
        this.current = {
            id: this.outbreaks.length + 1,
            world: this.world,
            source: source,
            start_tick: this.env.total_ticks,
            end_tick: null,
            end_reason: null,
            peak_infected: 0,
            peak_prevalence: 0,
            appearances: 0,
            infections: 0,
            deaths: 0,
        };
        this.outbreaks.push(this.current);
    },

    endOutbreak(reason) {
        if (!this.current) return;
        this.current.end_tick = this.env.total_ticks;
        this.current.end_reason = reason;
        this.current = null;
    },

    recordAppearance() {
        this.appearances++;
        if (!this.current) this.startOutbreak('mutation');
        this.current.appearances++;
    },

    // infections and deaths can happen in the same tick covid first appears, before update() runs
    recordInfection() {
        this.infections++;
        if (!this.current) this.startOutbreak('placed');
        this.current.infections++;
    },

    recordDeath() {
        this.deaths++;
        if (!this.current) this.startOutbreak('placed');
        this.current.deaths++;
    },

    // returns [living organisms, infected organisms]; dead organisms stay in the list until the next tick
    countInfected() {
        let living = 0;
        let infected = 0;
        for (let org of this.env.organisms) {
            if (!org.living) continue;
            living++;
            for (let cell of org.anatomy.cells) {
                if (cell.state === CellStates.covid) {
                    infected++;
                    break;
                }
            }
        }
        return [living, infected];
    },

    // called once per tick, after organisms have updated
    update() {
        let [living, infected] = this.countInfected();
        this.infected = infected;
        if (this.infected > 0 && !this.current)
            this.startOutbreak('placed'); // e.g. dropped in from the editor
        if (this.current) {
            let prevalence = living > 0 ? this.infected / living : 0;
            if (this.infected > this.current.peak_infected) this.current.peak_infected = this.infected;
            if (prevalence > this.current.peak_prevalence) this.current.peak_prevalence = prevalence;
            if (this.infected === 0) this.endOutbreak('no infected left');
        }
        if (this.env.total_ticks % this.sample_rate === 0) {
            this.series.push([
                this.world, this.env.total_ticks, living, this.infected,
                living > 0 ? (100 * this.infected / living).toFixed(2) : 0,
                this.appearances, this.infections, this.deaths,
                this.current ? this.current.id : '',
            ]);
            if (this.series.length > this.max_samples) this.series.shift();
        }
    },

    seriesCSV() {
        let header = ['world', 'tick', 'organisms', 'infected', 'infected_pct',
            'appearances_total', 'infections_total', 'deaths_total', 'active_outbreak'];
        return [header].concat(this.series).map(row => row.join(',')).join('\n');
    },

    outbreaksCSV() {
        let header = ['outbreak', 'world', 'source', 'start_tick', 'end_tick', 'duration_ticks', 'end_reason',
            'peak_infected', 'peak_infected_pct', 'appearances', 'infections', 'deaths'];
        let rows = this.outbreaks.map(o => [
            o.id, o.world, o.source, o.start_tick,
            o.end_tick === null ? '' : o.end_tick,
            o.end_tick === null ? '' : o.end_tick - o.start_tick,
            o.end_reason || 'ongoing',
            o.peak_infected, (100 * o.peak_prevalence).toFixed(2),
            o.appearances, o.infections, o.deaths,
        ]);
        return [header].concat(rows).map(row => row.join(',')).join('\n');
    },
}

module.exports = CovidStats;
