Ext.define('DependencyList', {
    extend: 'Rally.app.App',
    requires: [
        'Rally.ui.gridboard.plugin.GridBoardFieldPicker'
    ],
    uses: [
        'Ext.ux.exporter.Exporter'
    ],
    componentCls: 'app',
    launch: function() {
        var dependencyFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'c_DependencyDescription',
            operator: 'contains',
            value: 'a'
        });
        var app = this;
        this._myGrid = this.add({
            xtype: 'rallygrid',
            enableBulkEdit: true,
            height: 600,
            columnCfgs: [{
                    dataIndex: 'FormattedID',
                    width: 60
                },
                'Name',
                'State', {
                    dataIndex: 'c_DependencyDescription',
                    width: 250
                },
                'PlannedStartDate',
                'PlannedEndDate',
                'c_BusinessLead'
            ],
            context: this.getContext(),
            storeConfig: {
                models: [
                    'portfolioitem'
                ],
                sorters: {
                    property: 'Rank',
                    direction: 'DESC'
                },
                filters: dependencyFilter
            }
        });
    },
    _updateGrid: function(myStore) {
        // me.logger.log("Updating Grid");
        this._myGrid.reconfigure(myStore);
    },

    onTimeboxScopeChange: function(newTimeboxScope) {
        // // me.logger.log("Timebox Changed called");
        var newFilter = (newTimeboxScope.getQueryFilter());
        var store = this._myGrid.getStore();
        store.clearFilter(true);
        store.filter(newFilter);
        this._updateGrid(store);
    }
});
