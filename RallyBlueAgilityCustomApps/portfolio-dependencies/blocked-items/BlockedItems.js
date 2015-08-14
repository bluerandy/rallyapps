Ext.define('BlockedItems', {
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
            property: 'c_Blocked',
            operator: '=',
            value: true });
        var app = this;
        this._myGrid = this.add({
            xtype: 'rallygrid',
            enableBulkEdit: true,
            height: 600,
            columnCfgs: [
                'FormattedID',
                'Name',
                'State',
                'c_BlockedReason',
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