Ext.define('Rally.apps.portfoliodrilldown.SuccessDashboardApp', {
    extend: 'Rally.app.App',
    currentTimebox: null,
    requires: [
        'Rally.data.Ranker',
        'Rally.ui.gridboard.GridBoard',
        'Rally.ui.grid.TreeGrid',
        'Rally.data.wsapi.TreeStoreBuilder',
        'Rally.ui.cardboard.plugin.FixedHeader',
        'Rally.ui.cardboard.plugin.Print',
        'Rally.ui.gridboard.plugin.GridBoardAddNew',
        'Rally.ui.gridboard.plugin.GridBoardOwnerFilter',
        'Rally.ui.gridboard.plugin.GridBoardFilterInfo',
        'Rally.ui.gridboard.plugin.GridBoardArtifactTypeChooser',
        'Rally.ui.gridboard.plugin.GridBoardFieldPicker',
        'Rally.ui.cardboard.plugin.ColumnPolicy',
        'Rally.ui.gridboard.plugin.GridBoardFilterInfo',
        'Rally.ui.gridboard.plugin.GridBoardFilterControl',
        'Rally.ui.gridboard.plugin.GridBoardToggleable',
        'Rally.ui.grid.plugin.TreeGridExpandedRowPersistence',
        'Rally.ui.gridboard.plugin.GridBoardExpandAll',
        'Rally.ui.gridboard.plugin.GridBoardCustomView',
        'Rally.ui.filter.view.ModelFilter',
        'Rally.ui.filter.view.OwnerFilter',
        'Rally.ui.filter.view.OwnerPillFilter',
        'Rally.ui.filter.view.TagPillFilter',
        'Rally.ui.picker.FieldPicker',
        'Rally.app.Message',
        'Rally.ui.grid.plugin.PercentDonePopoverPlugin',
        'Rally.clientmetrics.ClientMetricsRecordable'
    ],
    mixins: [
        'Rally.app.CardFieldSelectable',
        'Rally.Messageable',
        'Rally.clientmetrics.ClientMetricsRecordable'
    ],
    componentCls: 'portfoliotracking',
    alias: 'widget.rallyportfoliotracking',
    settingsScope: 'project',
    scopeType: 'release',
    logger: new Rally.debug.logger(),
    autoScroll: false,
    config: {
        defaultSettings: {
            ignoreProjectScoping: true
        }
    },
    eModelNames: [
        'User Story',
        'Defect',
        'Defect Suite',
        'Test Set'
    ],
    sModelNames: [],
    getSettingsFields: function() {
        var fields = this.callParent(arguments);
        return fields;
    },
    onTimeboxScopeChanged: function(timebox) {
        this.callParent(arguments);
    },
    launch: function() {
        this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
        this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
        if (this.currentTimebox === null) {
            // me.logger.log('Success Dashboard: currentTimebox is null, requesting timebox');
            this.publish('requestTimebox', this);
        }
    },
    _updateGridBoard: function(timeboxFilter) {
        // me.logger.log("UpdateGridBoard: ", timeboxFilter);
        this.remove('successDashboardApp');
        var typeStore = Ext.create('Rally.data.wsapi.Store', {
            autoLoad: false,
            model: 'TypeDefinition',
            sorters: [],
            filters: [{
                property: 'Parent.Name',
                operator: '=',
                value: 'Portfolio Item'
            }, {
                property: 'Creatable',
                operator: '=',
                value: true
            }]
        });
        typeStore.load({
            scope: this,
            callback: function(records) {
                this.sModelNames = _.map(records, function(rec) {
                    return rec.get('TypePath');
                });
                this.sModelMap = _.transform(records, function(acc, rec) {
                    acc[rec.get('TypePath')] = rec;
                }, {});
                this._getGridStore(timeboxFilter).then({
                    success: function(gridStore) {
                        var model = gridStore.model;
                        this._addGridBoard(gridStore);
                        gridStore.on('parenttypeschange', function() {
                            if (gridStore.isLoading()) {
                                gridStore.on('load', function() {
                                    gridStore.reload();
                                }, this, {
                                    single: true
                                });
                            } else {
                                gridStore.load();
                            }
                        }, this);
                    },
                    scope: this
                });
            }
        });
    },
    _getModelNames: function() {
        return _.union(this.sModelNames, this.eModelNames);
    },
    _getGridStore: function(timeboxFilter) {
        // me.logger.log("GetGridStore: ", timeboxFilter);
        var childFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'DirectChildrenCount',
            value: "0",
            operator: '>'
        });
        var someCompleted = Ext.create('Rally.data.wsapi.Filter', {
            property: 'PercentDoneByStoryCount',
            value: "0",
            operator: '>'
        });
        var filters = childFilter.and(someCompleted);
        if (timeboxFilter !== null)
            filters = filters.and(timeboxFilter);
        // me.logger.log('Filters: ', timeboxFilter, filters);
        var context = this.getContext(),
            config = {
                models: this._getModelNames(),
                autoLoad: false,
                remoteSort: true,
                filters: filters,
                root: {
                    expanded: true
                },
                enableHierarchy: true,
                expandingNodesRespectProjectScoping: false
            };
        return Ext.create('Rally.data.wsapi.TreeStoreBuilder').build(config).then({
            success: function(store) {
                // me.logger.log("Success with TreeStoreBuilder");
                return store;
            }
        });
    },
    _addGridBoard: function(gridStore) {
        var context = this.getContext();
        this.remove('successDashboard');
        this.gridboard = this.add({
            itemId: 'successDashboardApp',
            xtype: 'rallygridboard',
            stateId: 'successDashboardApp',
            context: context,
            plugins: this._getGridBoardPlugins(),
            modelNames: this._getModelNames(),
            gridConfig: this._getGridConfig(gridStore),
            addNewPluginConfig: {
                style: {
                    'float': 'left',
                    'margin-right': '5px'
                }
            },
            listeners: {
                load: this._onLoad,
                toggle: this._onToggle,
                recordupdate: this._publishContentUpdatedNoDashboardLayout,
                recordcreate: this._publishContentUpdatedNoDashboardLayout,
                scope: this
            },
            height: Math.max(this.getAvailableGridBoardHeight(), 150)
        });
    },
    /**
     * @private
     */
    getAvailableGridBoardHeight: function() {
        var height = this.getHeight();
        return height;
    },
    _getGridBoardPlugins: function() {
        var plugins = [
                'rallygridboardaddnew'
            ],
            context = this.getContext();
        plugins.push('rallygridboardportfolioitemtypechooser');
        return plugins;
    },
    setHeight: Ext.Function.createBuffered(function() {
        this.superclass.setHeight.apply(this, arguments);
        this._resizeGridBoardToFillSpace();
    }, 100),
    _resizeGridBoardToFillSpace: function() {
        if (this.gridboard) {
            this.gridboard.setHeight(this.getAvailableGridBoardHeight());
        }
    },
    _getGridConfig: function(gridStore) {
        var gridConfig = {
            xtype: 'rallytreegrid',
            store: gridStore,
            enableRanking: this.getContext().getWorkspace().WorkspaceConfiguration.DragDropRankingEnabled,
            columns: this._getGridColumns(),
            columnCfgs: this._getGridColumns(),
            defaultColumnCfgs: this._getGridColumns(),
            showSummary: true,
            summaryColumns: this._getSummaryColumnConfig(),
            plugins: [],
            stateId: null,
            stateful: false
        };
        return gridConfig;
    },
    _getSummaryColumnConfig: function() {
        var taskUnitName = this.getContext().getWorkspace().WorkspaceConfiguration.TaskUnitName,
            planEstimateUnitName =
            this.getContext().getWorkspace().WorkspaceConfiguration.IterationEstimateUnitName;
        return [{
            field: 'AcceptedLeafStoryCount',
            type: 'sum',
            units: 'Total'
        }, {
            field: 'AcceptedLeafStoryPlanEstimateTotal',
            type: 'sum',
            units: planEstimateUnitName
        }, {
            field: 'LeafStoryCount',
            type: 'sum',
            units: 'Total'
        }, {
            field: 'LeafStoryPlanEstimateTotal',
            type: 'sum',
            units: planEstimateUnitName
        }, {
            field: 'UnEstimatedLeafStoryCount',
            type: 'sum',
            units: 'Total'
        }];
    },
    _getGridColumns: function() {
        var result = [{
            text: 'Name',
            dataIndex: 'Name',
            flex: 1
        }, {
            text: 'Value Metric/KPI',
            dataIndex: 'c_ValueMetricKPI',
            flex: 1
        }, {
            text: 'Project',
            dataIndex: 'Project',
            flex: 0.5
        }, {
            text: 'Story State',
            dataIndex: 'ScheduleState',
            flex: 0.5
        }, {
            text: '% Completed (By Points)',
            dataIndex: 'PercentDoneByStoryPlanEstimate',
            flex: 0.5
        }, {
            text: 'Total Size (Points)',
            dataIndex: 'LeafStoryPlanEstimateTotal',
            flex: 0.3
        }, {
            text: 'Story Size (Points)',
            dataIndex: 'PlanEstimate',
            flex: 0.3
        }, {
            text: 'Planned Start',
            dataIndex: 'PlannedStartDate',
            xtype: 'datecolumn',
            format: 'n-j-Y',
            flex: 0.4
        }, {
            text: 'Actual Start',
            dataIndex: 'ActualStartDate',
            xtype: 'datecolumn',
            format: 'n-j-Y',
            flex: 0.4
        }, {
            text: 'Planned End',
            dataIndex: 'PlannedEndDate',
            xtype: 'datecolumn',
            format: 'n-j-Y',
            flex: 0.4
        }, {
            text: 'Actual End',
            dataIndex: 'ActualEndDate',
            xtype: 'datecolumn',
            format: 'n-j-Y',
            flex: 0.4
        }, {
            text: 'Owner',
            dataIndex: 'Owner',
            flex: 0.5
        }];
        return result;
    },
    _createReleaseFilter: function(release) {
        // me.logger.log('creating release filter: ', release);
        var releaseStartFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "PlannedEndDate",
            operator: ">=",
            value: Rally.util.DateTime.toIsoString(release.get('ReleaseStartDate'))
        });
        var releaseEndFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "PlannedEndDate",
            operator: "<=",
            value: Rally.util.DateTime.toIsoString(release.get('ReleaseDate'))
        });
        return releaseEndFilter.and(releaseStartFilter);
    },
    _releaseChanged: function(release) {
        if (release !== null) {
            // me.logger.log("Success Dashboard: Got release changed message", release);
            if (_.isNull(this.currentTimebox) || release.get('Name') != this.currentTimebox.get('Name')) {
                // me.logger.log("Success: release changed, updating board");
                this.getContext().setTimeboxScope(release, 'release');
                this.currentTimebox = release;
                var filters = this._createReleaseFilter(release);
                // me.logger.log("Filters created: ", filters);
                this._updateGridBoard(filters);
            } else {
                // me.logger.log("Success Dashboard: Release change message, no change");
            }
        }
    },
    _createIterationFilter: function(iteration) {
        // me.logger.log("Creating iteration filter: ", iteration);
        var iterationStartFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "PlannedEndDate",
            operator: ">=",
            value: Rally.util.DateTime.toIsoString(iteration.get('StartDate'))
        });
        var iterationEndFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: "PlannedEndDate",
            operator: "<=",
            value: Rally.util.DateTime.toIsoString(iteration.get('EndDate'))
        });
        return iterationStartFilter.and(iterationEndFilter);
    },
    _iterationChanged: function(iteration) {
        if (iteration !== null) {
            // me.logger.log("Success Dashboard: Got iteration changed message", iteration);
            if (_.isNull(this.currentTimebox) || iteration.get('Name') != this.currentTimebox.get('Name')) {
                this.getContext().setTimeboxScope(iteration, 'iteration');
                this.currentTimebox = iteration;
                // me.logger.log("Success: iteration changed, updating board");
                this._updateGridBoard(this._createIterationFilter(iteration));
            } else {
                // me.logger.log("Iteration change message, no change");
            }
        }
    },
    _onLoad: function() {
        this._publishContentUpdated();
        this.recordComponentReady();
    },
    _onBoardFilter: function() {
        this.setLoading(true);
    },
    _onBoardFilterComplete: function() {
        this.setLoading(false);
    },
    _onToggle: function(toggleState) {
        var appEl = this.getEl();
        if (toggleState === 'board') {
            appEl.replaceCls('grid-toggled', 'board-toggled');
        } else {
            appEl.replaceCls('board-toggled', 'grid-toggled');
        }
        this._publishContentUpdated();
    },
    _publishContentUpdated: function() {
        this.fireEvent('contentupdated');
    },
    _publishContentUpdatedNoDashboardLayout: function() {
        this.fireEvent('contentupdated', {
            dashboardLayout: false
        });
    }
});
