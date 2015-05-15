Ext.define('Rally.apps.releasetracking.StatsBanner', {
        extend : 'Ext.Container',
        alias : 'widget.statsbanner',
        requires : [
                        'Rally.apps.releasetracking.statsbanner.PlannedVelocity',
                        'Rally.apps.releasetracking.statsbanner.TimeboxEnd',
                        'Rally.apps.releasetracking.statsbanner.LateStories',
                        'Rally.apps.releasetracking.statsbanner.AcceptedPoint',
                        'Rally.apps.releasetracking.statsbanner.AcceptedCount',
                        'Rally.apps.releasetracking.statsbanner.EstimatedStories',
                        'Rally.apps.releasetracking.statsbanner.IterationProgress',
                        'Rally.apps.releasetracking.statsbanner.CollapseExpand'
        ],
        mixins : [
                        'Rally.Messageable',
                        'Rally.clientmetrics.ClientMetricsRecordable'
        ],
        cls : 'stats-banner',
        layout : 'hbox',
        border : 0,
        width : '100%',
        stateful : true,
        config : {
                context : this.getContext(),
                expanded : true
        },
        items : [
                        {
                            xtype : 'statsbannertimeboxend'
                        },
                        {
                            xtype : 'statsbannerestimatedstories'
                        },
                        {
                            xtype : 'statsbanneracceptedpoint'
                        },
                        {
                            xtype : 'statsbanneracceptedcount'
                        }
        ],
        constructor : function()
        {
            console.log('banner constructor');
            this.stateId = Rally.environment.getContext().getScopedStateId('stats-banner');
            this.callParent(arguments);
        },
        initComponent : function()
        {
            console.log('banner init');
            this.subscribe(this, Rally.Message.objectDestroy, this._update, this);
            this.subscribe(this, Rally.Message.objectCreate, this._update, this);
            this.subscribe(this, Rally.Message.objectUpdate, this._update, this);
            this.subscribe(this, Rally.Message.bulkUpdate, this._update, this);
            this.store = Ext.create('Rally.data.wsapi.artifact.Store', {
                    models : [
                        'PortfolioItem/Feature'
                    ],
                    fetch : [
                                    'Name',
                                    'PercentDoneByStoryCount',
                                    'PercentDoneByStoryPlanEstimate',
                                    'Release[Name;ReleaseStartDate;ReleaseDate]',
                                    'PreliminaryEstimate[Value]',
                                    'LateChildCount',
                                    'AcceptedLeafStoryPlanEstimateTotal',
                                    'AcceptedLeafStoryCount',
                                    'LeafStoryCount',
                                    'LeafStoryPlanEstimateTotal',
                                    'UnEstimatedLeafStoryCount',
                                    'PlannedStartDate',
                                    'PlannedEndDate',
                                    'ActualStartDate',
                                    'ActualEndDate',
                                    'UserStories:summary[ScheduleState;PlanEstimate;ScheduleState+Blocked]'
                    ],
                    useShallowFetch : true,
                    filters : [
                        this.getContext().getTimeboxScope().getQueryFilter()
                    ],
                    context : this.context,
                    limit : Infinity,
                    requester : this
            });
            console.log('banner created store');
            this.items = this._configureItems(this.items);
            this.on('expand', this._onExpand, this);
            this.on('collapse', this._onCollapse, this);
            this.callParent(arguments);
            console.log('banner updating');
            this._update();
        },
        onRender : function()
        {
            if (this.expanded)
            {
                this.removeCls('collapsed');
            } else
            {
                this.addCls('collapsed');
            }
            this._setExpandedOnChildItems();
            this.callParent(arguments);
        },
        applyState : function(state)
        {
            if (Ext.isDefined(state.expanded))
            {
                this.setExpanded(state.expanded);
            }
            this._setExpandedOnChildItems();
        },
        getState : function()
        {
            return {
                expanded : this.expanded
            };
        },
        _setExpandedOnChildItems : function()
        {
            _.each(this.items.getRange(), function(item)
            {
                item.setExpanded(this.expanded);
            }, this);
        },
        _getItemDefaults : function()
        {
            return {
                    flex : 1,
                    context : this.context,
                    store : this.store,
                    listeners : {
                            ready : this._onReady,
                            scope : this
                    }
            };
        },
        _onReady : function()
        {
            this._readyCount = (this._readyCount || 0) + 1;
            if (this._readyCount === this.items.getCount())
            {
                this.recordComponentReady();
                delete this._readyCount;
            }
        },
        _onCollapse : function()
        {
            this.addCls('collapsed');
            this.setExpanded(false);
            _.invoke(this.items.getRange(), 'collapse');
        },
        _onExpand : function()
        {
            this.removeCls('collapsed');
            this.setExpanded(true);
            _.invoke(this.items.getRange(), 'expand');
        },
        _hasTimebox : function()
        {
            console.log('timebox check: ', this.context.getTimeboxScope());
            return !!this.context.getTimeboxScope().getRecord();
        },
        _configureItems : function(items)
        {
            var defaults = this._getItemDefaults();
            return _.map(items, function(item)
            {
                return _.defaults(_.cloneDeep(item), defaults);
            });
        },
        _update : function()
        {
            if (this._hasTimebox())
            {
                console.log('has timebox, loading');
                this.store.load();
            }
        }
});
