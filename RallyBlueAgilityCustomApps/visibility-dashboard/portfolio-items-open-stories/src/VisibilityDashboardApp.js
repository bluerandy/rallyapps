Ext.define('Rally.apps.portfoliodrilldown.VisibilityDashboardApp', {
        extend : 'Rally.app.TimeboxScopedApp',
        currentTimebox : null,
        requires : [
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
        mixins : [
                        'Rally.app.CardFieldSelectable',
                        'Rally.Messageable',
                        'Rally.clientmetrics.ClientMetricsRecordable'
        ],
        componentCls : 'portfoliotracking',
        alias : 'widget.rallyportfoliotracking',
        settingsScope : 'project',
        scopeType : 'release',
        autoScroll : false,
        config : {
            defaultSettings : {
                ignoreProjectScoping : true
            }
        },
        eModelNames : [
                        'User Story',
                        'Defect',
                        'Defect Suite',
                        'Test Set'
        ],
        sModelNames : [],
        getSettingsFields : function()
        {
            var fields = this.callParent(arguments);
            return fields;
        },
        onTimeboxScopeChanged : function(timebox)
        {
            this.callParent(arguments);
        },
        launch : function()
        {
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            if (this.currentTimebox === null)
                this.publish('requestTimebox', this);
        },
        _updateGridBoard : function(timeboxFilter)
        {
            var typeStore = Ext.create('Rally.data.wsapi.Store', {
                    autoLoad : false,
                    model : 'TypeDefinition',
                    sorters : [
                        {
                                property : 'Ordinal',
                                direction : 'ASC'
                        }
                    ],
                    filters : [
                                    {
                                            property : 'Parent.Name',
                                            operator : '=',
                                            value : 'Portfolio Item'
                                    },
                                    {
                                            property : 'Creatable',
                                            operator : '=',
                                            value : true
                                    }
                    ]
            });
            typeStore.load({
                    scope : this,
                    callback : function(records)
                    {
                        this.sModelNames = _.map(records, function(rec)
                        {
                            return rec.get('TypePath');
                        });
                        this.sModelMap = _.transform(records, function(acc, rec)
                        {
                            acc[rec.get('TypePath')] = rec;
                        }, {});
                        this._getGridStore(timeboxFilter).then({
                                success : function(gridStore)
                                {
                                    var model = gridStore.model;
                                    this._addGridBoard(gridStore);
                                    gridStore.on('parenttypeschange', function()
                                    {
                                        if (gridStore.isLoading())
                                        {
                                            gridStore.on('load', function()
                                            {
                                                gridStore.reload();
                                            }, this, {
                                                single : true
                                            });
                                        } else
                                        {
                                            gridStore.load();
                                        }
                                    }, this);
                                },
                                scope : this
                        });
                    }
            });
        },
        _getModelNames : function()
        {
            return _.union(this.sModelNames, this.eModelNames);
        },
        _getGridStore : function(timeboxFilter)
        {
            var childFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'DirectChildrenCount',
                    value : "0",
                    operator : '>'
            });
            var someCompleted = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'PercentDoneByStoryCount',
                    value : "100",
                    operator : '<'
            });
            var filters = timeboxFilter.and(childFilter).and(someCompleted);
            console.log('Filters: ', timeboxFilter, filters);
            var context = this.getContext(), config = {
                    models : this._getModelNames(),
                    autoLoad : false,
                    remoteSort : true,
                    filters : filters,
                    timeFilter : this.context.getTimeboxScope().getQueryFilter(),
                    root : {
                        expanded : true
                    },
                    enableHierarchy : true,
                    expandingNodesRespectProjectScoping : false
            };
            return Ext.create('Rally.data.wsapi.TreeStoreBuilder').build(config).then({
                success : function(store)
                {
                    return store;
                }
            });
        },
        _addGridBoard : function(gridStore)
        {
            var context = this.getContext();
            this.remove('visibilityDashboard');
            this.gridboard = this.add({
                    itemId : 'visibilityDashboard',
                    xtype : 'rallygridboard',
                    stateId : 'visibilityDashboard',
                    context : context,
                    plugins : this._getGridBoardPlugins(),
                    modelNames : this._getModelNames(),
                    gridConfig : this._getGridConfig(gridStore),
                    addNewPluginConfig : {
                        style : {
                                'float' : 'left',
                                'margin-right' : '5px'
                        }
                    },
                    listeners : {
                            load : this._onLoad,
                            toggle : this._onToggle,
                            recordupdate : this._publishContentUpdatedNoDashboardLayout,
                            recordcreate : this._publishContentUpdatedNoDashboardLayout,
                            scope : this
                    },
                    height : Math.max(this.getAvailableGridBoardHeight(), 150)
            });
        },
        /**
         * @private
         */
        getAvailableGridBoardHeight : function()
        {
            var height = this.getHeight();
            return height;
        },
        _getGridBoardPlugins : function()
        {
            var plugins = [
                'rallygridboardaddnew'
            ], context = this.getContext();
            plugins.push('rallygridboardportfolioitemtypechooser');
            return plugins;
        },
        setHeight : Ext.Function.createBuffered(function()
        {
            this.superclass.setHeight.apply(this, arguments);
            this._resizeGridBoardToFillSpace();
        }, 100),
        _resizeGridBoardToFillSpace : function()
        {
            if (this.gridboard)
            {
                this.gridboard.setHeight(this.getAvailableGridBoardHeight());
            }
        },
        _getGridConfig : function(gridStore)
        {
            var gridConfig = {
                    xtype : 'rallytreegrid',
                    store : gridStore,
                    enableRanking : this.getContext().getWorkspace().WorkspaceConfiguration.DragDropRankingEnabled,
                    columns : this._getGridColumns(),
                    columnCfgs : this._getGridColumns(),
                    defaultColumnCfgs : this._getGridColumns(),
                    showSummary : true,
                    summaryColumns : this._getSummaryColumnConfig(),
                    plugins : [],
                    stateId : null,
                    stateful : false
            };
            return gridConfig;
        },
        _getSummaryColumnConfig : function()
        {
            var taskUnitName = this.getContext().getWorkspace().WorkspaceConfiguration.TaskUnitName, planEstimateUnitName =
                            this.getContext().getWorkspace().WorkspaceConfiguration.IterationEstimateUnitName;
            return [
                            {
                                    field : 'AcceptedLeafStoryCount',
                                    type : 'sum',
                                    units : 'Total'
                            },
                            {
                                    field : 'AcceptedLeafStoryPlanEstimateTotal',
                                    type : 'sum',
                                    units : planEstimateUnitName
                            },
                            {
                                    field : 'LeafStoryCount',
                                    type : 'sum',
                                    units : 'Total'
                            },
                            {
                                    field : 'LeafStoryPlanEstimateTotal',
                                    type : 'sum',
                                    units : planEstimateUnitName
                            },
                            {
                                    field : 'UnEstimatedLeafStoryCount',
                                    type : 'sum',
                                    units : 'Total'
                            }
            ];
        },
        _getGridColumns : function()
        {
            var result = [
                            {
                                    text : 'Name',
                                    dataIndex : 'Name'
                            },
                            {
                                    text : 'Value Metric/KPI',
                                    dataIndex : 'c_ValueMetricKPI'
                            },
                            {
                                    text : 'Value Score',
                                    dataIndex : 'ValueScore',
                                    xtype : 'numbercolumn'
                            },
                            {
                                    text : 'Story State',
                                    dataIndex : 'ScheduleState'
                            },
                            {
                                    text : '% Completed (By Points)',
                                    dataIndex : 'PercentDoneByStoryPlanEstimate'
                            },
                            {
                                    text : 'Total Size (Points)',
                                    dataIndex : 'LeafStoryPlanEstimateTotal'
                            },
                            {
                                    text : 'Story Size (Points)',
                                    dataIndex : 'PlanEstimate'
                            },
                            {
                                    text : 'Planned Start',
                                    dataIndex : 'PlannedStartDate',
                                    xtype : 'datecolumn',
                                    format : 'n-j-Y'
                            },
                            {
                                    text : 'Actual Start',
                                    dataIndex : 'ActualStartDate',
                                    xtype : 'datecolumn',
                                    format : 'n-j-Y'
                            },
                            {
                                    text : 'Planned End',
                                    dataIndex : 'PlannedEndDate',
                                    xtype : 'datecolumn',
                                    format : 'n-j-Y'
                            },
                            {
                                    text : 'Actual End',
                                    dataIndex : 'ActualEndDate',
                                    xtype : 'datecolumn',
                                    format : 'n-j-Y'
                            },
                            {
                                    text : 'Owner',
                                    dataIndex : 'Owner'
                            }
            ];
            return result;
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
                this._updateGridBoard(timeboxFilter);
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
                this._updateGridBoard(timeboxFilter);
            } else
            {
                console.log("tasks: iteration change message, no change");
            }
        },
        _onLoad : function()
        {
            this._publishContentUpdated();
            this.recordComponentReady();
        },
        _onBoardFilter : function()
        {
            this.setLoading(true);
        },
        _onBoardFilterComplete : function()
        {
            this.setLoading(false);
        },
        _onToggle : function(toggleState)
        {
            var appEl = this.getEl();
            if (toggleState === 'board')
            {
                appEl.replaceCls('grid-toggled', 'board-toggled');
            } else
            {
                appEl.replaceCls('board-toggled', 'grid-toggled');
            }
            this._publishContentUpdated();
        },
        _publishContentUpdated : function()
        {
            this.fireEvent('contentupdated');
        },
        _publishContentUpdatedNoDashboardLayout : function()
        {
            this.fireEvent('contentupdated', {
                dashboardLayout : false
            });
        }
});
