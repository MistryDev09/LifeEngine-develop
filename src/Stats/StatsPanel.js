const PopulationChart = require("./Charts/PopulationChart");
const SpeciesChart = require("./Charts/SpeciesChart");
const MutationChart = require("./Charts/MutationChart");
const CellsChart = require("./Charts/CellsChart");
const LifeHistoryChart = require("./Charts/LifeHistoryChart");
const FossilRecord = require("./FossilRecord");
const SpeciesPopulationChart = require("./Charts/SpeciesPopulationChart");
const TrackingPanel = require("./TrackingPanel");
const CovidStats = require("./CovidStats");


const ChartSelections = [PopulationChart, SpeciesChart, CellsChart, MutationChart];
ChartSelections.push(SpeciesPopulationChart); // index 4, existing indexes unchanged
ChartSelections.push(LifeHistoryChart);

class StatsPanel {
    constructor(env) {
        this.defineControls();
        TrackingPanel.init(() => this.updateChart());
        this.chart_selection = 0;
        this.setChart();
        this.env = env;
        this.last_reset_count=env.reset_count;
    }

    setChart(selection=this.chart_selection) {
        $('#species-legend').empty(); // only the species chart draws a legend here
        this.chart_controller = new ChartSelections[selection]();
        this.chart_controller.setData();
        this.chart_controller.render();
    }

    startAutoRender() {
        this.setChart();
        this.render_loop = setInterval(function(){this.updateChart();}.bind(this), 1000);
    }

    stopAutoRender() {
        clearInterval(this.render_loop);
    }

    defineControls() {
        $('#chart-option').change ( function() {
            this.chart_selection = $("#chart-option")[0].selectedIndex;
            this.setChart();
        }.bind(this));
        $('#covid-download-series').click(() => this.download('covid_timeseries.csv', CovidStats.seriesCSV()));
        $('#covid-download-outbreaks').click(() => this.download('covid_outbreaks.csv', CovidStats.outbreaksCSV()));
        $('#covid-clear').click(() => {
            if (confirm('Clear all recorded covid data?'))
                CovidStats.clear();
        });
    }

    download(filename, text) {
        const url = URL.createObjectURL(new Blob([text], {type: 'text/csv'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    updateChart() {
        if (this.last_reset_count < this.env.reset_count){
            this.reset()
        }
        this.last_reset_count = this.env.reset_count;
        this.chart_controller.updateData();
        this.chart_controller.render();
        TrackingPanel.render();
    }

    updateDetails() {
        var org_count = this.env.organisms.length;
        $('#org-count').text("Total Population: " + org_count);
        $('#species-count').text("Number of Species: " + FossilRecord.numExtantSpecies());
        let top_species = FossilRecord.getMostPopulousSpecies();
        if (top_species)
            $('#top-species').text("Most Populous Species: \"" + top_species.name + "\" (" + top_species.population + " organisms)");
        else    
            $('#top-species').text("Most Populous Species: None");
        $('#largest-org').text("Largest Organism Ever: " + this.env.largest_cell_count + " cells");
        $('#avg-mut').text("Average Mutation Rate: " + Math.round(this.env.averageMutability() * 100) / 100);
        let lh = this.env.averageLifeHistory();
        $('#avg-life-history').text("Life History (repro/lifespan/dispersal): "
            + Math.round(lh.repro_threshold * 1000) / 1000 + " / "
            + Math.round(lh.lifespan_factor * 1000) / 1000 + " / "
            + Math.round(lh.dispersal * 1000) / 1000);
        let living = this.env.organisms.length;
        let pct = living > 0 ? Math.round(1000 * CovidStats.infected / living) / 10 : 0;
        $('#covid-infected').text("Infected organisms: " + CovidStats.infected + " (" + pct + "%)");
        $('#covid-appearances').text("Appearances by mutation: " + CovidStats.appearances);
        $('#covid-infections').text("Contact infections: " + CovidStats.infections);
        $('#covid-deaths').text("Deaths from covid: " + CovidStats.deaths);
        let ongoing = CovidStats.current ? " (outbreak #" + CovidStats.current.id + " ongoing)" : "";
        $('#covid-outbreaks').text("Outbreaks recorded: " + CovidStats.outbreaks.length + ongoing);
    }

    reset() {
        this.setChart();
        TrackingPanel.render();
    }
    
}

module.exports = StatsPanel;