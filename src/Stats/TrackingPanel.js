// The Tracked Species panel in the Statistics tab: buttons, and a list of the tracked species.
const FossilRecord = require("./FossilRecord");
const SpeciesTracker = require("./SpeciesTracker");
const OrganismPicture = require("./OrganismPicture"); // draws the body pictures

const TrackingPanel = {
    showExtinct: false, // extinct species with no living or tracked descendants are hidden unless this is true

    // onChange called on every button press, so the list and chart refresh
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
        $('#track-clear').click(() => {
            SpeciesTracker.untrackAll();
            this.onChange();
        });
        $('#track-extinct').click(() => {
            this.showExtinct = !this.showExtinct;
            $('#track-extinct').text(this.showExtinct ? 'Hide extinct' : 'Show extinct');
            this.onChange();
        });

        // show the name of the species under the mouse. The tree is rebuilt every second,
        // which stops the browser's own tooltips from appearing
        $('#species-tree').on('mouseover', 'li', function(event) {
            event.stopPropagation(); // only the row under the mouse, not the rows it is inside
            $('#species-name').text($(this).attr('data-name'));
        });
        $('#species-tree').on('mouseleave', () => $('#species-name').text(''));
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

    // a list with a row for each of the given species that should be shown, in sorted order
    makeList(ids) {
        const list = $('<ul>');
        const sorted = ids.slice().sort((a, b) => this.compareSpecies(SpeciesTracker.lineage[a], SpeciesTracker.lineage[b]));
        for (const id of sorted) {
            if (this.isShown(id)) {
                list.append(this.makeRow(id));
            }
        }
        return list;
    },

    // the order of rows in a list: tracked species first, then living species (biggest population first),
    // then extinct species (earliest extinction first)
    compareSpecies(a, b) {
        const a_tracked = SpeciesTracker.isTracked(a.id);
        const b_tracked = SpeciesTracker.isTracked(b.id);
        if (a_tracked !== b_tracked) {
            return a_tracked ? -1 : 1;
        }
        if (a.extinct !== b.extinct) {
            return a.extinct ? 1 : -1;
        }
        if (a.extinct) {
            return a.end_tick - b.end_tick;
        }
        return b.population - a.population;
    },

    // true if the species is alive or tracked, or if any of its descendants is
    hasLiveOrTracked(id) {
        const species = SpeciesTracker.lineage[id];
        if (!species.extinct || SpeciesTracker.isTracked(id)) {
            return true;
        }
        for (const child_id of SpeciesTracker.children[id] || []) {
            if (this.hasLiveOrTracked(child_id)) {
                return true;
            }
        }
        return false;
    },

    // a species is shown if it is tracked or big enough, and, unless extinct species are shown, if it still matters
    isShown(id) {
        const species = SpeciesTracker.lineage[id];
        const big_enough = SpeciesTracker.isTracked(id) || species.cumulative_pop >= FossilRecord.min_discard;
        return big_enough && (this.showExtinct || this.hasLiveOrTracked(id));
    },

    // one species: dot, picture, ticks, remove button (tracked species only), then its descendants
    makeRow(id) {
        const species = SpeciesTracker.lineage[id];
        const tracked = SpeciesTracker.isTracked(id);
        const row = $('<li>').attr('data-name', species.name); // shown when the mouse rests on the row (see init)
        if (tracked) {
            row.append($('<span class="swatch">').css('background', SpeciesTracker.color(id)));
        }
        const picture = $(OrganismPicture.draw(species.anatomy));
        picture.css('cursor', 'pointer'); // click to track, or to untrack if already tracked
        picture.click(() => {
            if (tracked) {
                SpeciesTracker.untrack(id);
            } else {
                SpeciesTracker.track(id);
            }
            this.onChange();
        });
        row.append(picture);

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
