var app = null;
Ext.define('ProgramRisks', {
        extend : 'Rally.app.App',
        requires : [
            'Rally.ui.gridboard.plugin.GridBoardFieldPicker'
        ],
        mixins : [
            'Rally.Messageable'
        ],
        componentCls : 'app',
        launch : function()
        {
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            app = this;
        },
        _updateBoard : function(timeboxFilter)
        {
            var notDone = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'c_Risk',
                    value : true
            });
            var isRisk = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'State.Name',
                    operator : '!=',
                    value : 'Done'
            });
            var filters = timeboxFilter.and(isRisk).and(notDone);
            console.log("Risk filters: ", filters);
            this.remove('riskboard');
            this._myGrid = this.add({
                    xtype : 'rallygrid',
                    itemId : 'riskboard',
                    enableBulkEdit : true,
                    columnCfgs : [
                                    'FormattedID',
                                    'Name',
                                    'State',
                                    'Owner',
                                    'c_RiskDescription',
                                    {
                                            text : 'Age (Days)',
                                            dataIndex : 'CreationDate',
                                            width : 60,
                                            renderer : function(value)
                                            {
                                                var today = new Date();
                                                return Math.floor((today - value) / (1000 * 60 * 60 * 24));
                                            }
                                    }
                    ],
                    context : this.getContext(),
                    storeConfig : {
                            models : [
                                'portfolioitem'
                            ],
                            sorters : {
                                    property : 'CreationDate',
                                    direction : 'ASC'
                            },
                            filters : filters
                    }
            });
        },
        _releaseChanged : function(release)
        {
            if (this.currentTimebox === null || release.get('Name') != this.currentTimebox.get('Name'))
            {
                var releaseStartFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : "PlannedEndDate",
                        operator : ">=",
                        value : Rally.util.DateTime.toIsoString(release.get('ReleaseStartDate'))
                });
                var releaseEndFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : "PlannedEndDate",
                        operator : "<=",
                        value : Rally.util.DateTime.toIsoString(release.get('ReleaseDate'))
                });
                var timeboxFilter = releaseEndFilter.and(releaseStartFilter);
                this.currentTimebox = release;
                this.getContext().setTimeboxScope(release, 'release');
                this._updateBoard(timeboxFilter);
            } else
            {
                console.log("aging tasks: Release change message, no change");
            }
        },
        _iterationChanged : function(iteration)
        {
            if (this.currentTimebox === null || iteration.get('Name') != this.currentTimebox.get('Name'))
            {
                var iterationStartFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : "PlannedEndDate",
                        operator : ">=",
                        value : Rally.util.DateTime.toIsoString(iteration.get('StartDate'))
                });
                var iterationEndFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : "PlannedEndDate",
                        operator : "<=",
                        value : Rally.util.DateTime.toIsoString(iteration.get('EndDate'))
                });
                var timeboxFilter = iterationStartFilter.and(iterationEndFilter);
                this.currentTimebox = iteration;
                this.getContext().setTimeboxScope(iteration, 'iteration');
                this._updateBoard(timeboxFilter);
            } else
            {
                console.log("tasks: iteration change message, no change");
            }
        }
});
