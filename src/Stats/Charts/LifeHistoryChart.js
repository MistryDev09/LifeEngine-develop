const FossilRecord = require("../FossilRecord");
const ChartController = require("./ChartController");

// Population means of the three heritable life history genes. Plotted on the
// same tick axis as the population chart so that a trait trajectory can be
// lined up against the population it belongs to.
class LifeHistoryChart extends ChartController {
    constructor() {
        super("Life History Genes", "Gene value (1 = default)",
            "Population mean of each inherited life history gene. Compare against the Population chart: a gene still climbing while population falls is the signature of mis-adaptation.");
    }

    setData() {
        this.clear();
        const series = [
            {name: "repro", legend: "Reproduction Threshold", color: "#c1121f"},
            {name: "lifespan", legend: "Lifespan Factor", color: "#003049"},
            {name: "dispersal", legend: "Dispersal Range", color: "#2a9d8f"},
        ];
        for (let s of series) {
            this.data.push({
                type: "line",
                markerType: "none",
                color: s.color,
                showInLegend: true,
                name: s.name,
                legendText: s.legend,
                dataPoints: []
            });
        }
        this.addAllDataPoints();
    }

    addDataPoint(i) {
        var t = FossilRecord.tick_record[i];
        this.data[0].dataPoints.push({x:t, y:FossilRecord.av_repro_threshold[i]});
        this.data[1].dataPoints.push({x:t, y:FossilRecord.av_lifespan_factor[i]});
        this.data[2].dataPoints.push({x:t, y:FossilRecord.av_dispersal[i]});
    }
}

module.exports = LifeHistoryChart;
