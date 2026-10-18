// The Tracked Species panel in the Statistics tab: buttons, and a list of the tracked species.
const FossilRecord = require("./FossilRecord");
const SpeciesTracker = require("./SpeciesTracker");
const OrganismPicture = require("./OrganismPicture"); // draws the body pictures

const TrackingPanel = {
    // onChange is called after every button press, so the list and chart refresh even while the sim is paused
    init(onChange) {
        this.onChange = onChange;

        $('#track-add').click(() => {
            const name = $('#track-search').val().trim();
            const species = Object.values(FossilRecord.extant_species).find(s => s.name === name);
            if (species) {
                SpeciesTracker.track(species.id);
            }
            this.onChange();
        });
        $('#track-top').click(() => {
            SpeciesTracker.trackTop(5);
            this.onChange();
        });
        $('#track-clear').click(() => {
            SpeciesTracker.untrackAll();
            this.onChange();
        });
    },

    // redraws the whole tree: one family for each tracked species that is not inside another tracked family
    render() {
        const roots = [];
        for (const id in SpeciesTracker.tracked) {
            if (SpeciesTracker.nearestTrackedAncestor(id) === null) {
                roots.push(id);
            }
        }
        $('#species-tree').empty().append(this.makeList(roots));
    },

    // a list with a row for each of the given species that is tracked or big enough to show
    makeList(ids) {
        const list = $('<ul>');
        for (const id of ids) {
            const species = SpeciesTracker.lineage[id];
            if (SpeciesTracker.isTracked(id) || species.cumulative_pop >= FossilRecord.min_discard) {
                list.append(this.makeRow(id));
            }
        }
        return list;
    },

    // one species: dot, picture, ticks, remove button (tracked species only), then its descendants
    makeRow(id) {
        const species = SpeciesTracker.lineage[id];
        const tracked = SpeciesTracker.isTracked(id);
        const row = $('<li>').attr('title', species.name); // the name shows on hover
        if (tracked) {
            row.append($('<span class="swatch">').css('background', SpeciesTracker.color(id)));
        }
        row.append(OrganismPicture.draw(species.anatomy));

        let status;
        if (species.extinct) {
            status = ' (extinct) ' + species.start_tick + ' - ' + species.end_tick;
        } else {
            status = ' (' + species.population + ') born ' + species.start_tick;
        }
        row.append($('<span>').text(status));

        if (tracked) {
            const remove = $('<button>').text('✕');
            remove.click(() => {
                SpeciesTracker.untrack(id);
                this.onChange();
            });
            row.append(remove);
        }
        row.append(this.makeList(SpeciesTracker.children[id] || []));
        return row;
    },
};

module.exports = TrackingPanel;
