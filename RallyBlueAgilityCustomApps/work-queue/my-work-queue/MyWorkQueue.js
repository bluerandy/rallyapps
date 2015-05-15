Ext.define('MyWorkQueue', {
        extend : 'Rally.app.App',
        currentTimebox : null,
        mixins : [
            'Rally.Messageable'
        ],
        componentCls : 'app',
        launch : function()
        {
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            var me = this;
            if (this.currentTimebox === null)
                this.publish('requestTimebox', this);
        },
        _updateBoard : function(portfolioTimeboxFilter, storyTimeboxFilter)
        {
            var me = this;
            var field_names = [
                            'Name',
                            'State',
                            'FormattedID',
                            'PortfolioItemType',
                            'ScheduleState'
            ];
            var base_filter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Owner',
                    value : this.getContext().getUser()._ref
            });
            var ss_filter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'ScheduleState',
                    operator : '<',
                    value : 'Accepted'
            });
            var state_filter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'State',
                    operator : '<',
                    value : 'Completed'
            });
            var stateAndTimeFilter = state_filter.and(storyTimeboxFilter);
            var portfolio_filter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'State.Name',
                    operator : '!=',
                    value : 'Done'
            });
            var p_filter = portfolio_filter.and(portfolioTimeboxFilter);
            var s_filter = ss_filter.and(storyTimeboxFilter);
            var queries_to_run = {
                    'Defect' : s_filter,
                    'Task' : stateAndTimeFilter,
                    'PortfolioItem' : p_filter,
                    'HierarchicalRequirement' : s_filter
            };
            var promises = [];
            Ext.Object.each(queries_to_run, function(model_name, add_filter)
            {
                var p = function()
                {
                    return me._loadAStoreWithAPromise(model_name, field_names, base_filter.and(add_filter));
                };
                promises.push(p);
            });
            Deft.Chain.sequence(promises).then({
                    scope : this,
                    success : function(results)
                    {
                        var records = Ext.Array.flatten(results);
                        Ext.Array.each(records, function(record)
                        {
                            if (record.get('ScheduleState'))
                            {
                                record.set('__State', record.get('ScheduleState'));
                            } else if (record.get('PortfolioItemType'))
                            {
                                record.set('__State', record.get('State.Name'));
                            } else
                            {
                                record.set('__State', record.get('State'));
                            }
                        });
                        var store = Ext.create('Rally.data.custom.Store', {
                            data : records
                        });
                        this._displayGrid(store, field_names);
                    },
                    failure : function(error_message)
                    {
                        alert(error_message);
                    }
            }).always(function()
            {
                me.setLoading(false);
            });
        },
        _loadAStoreWithAPromise : function(model_name, model_fields, filters)
        {
            var deferred = Ext.create('Deft.Deferred');
            var me = this;
            Ext.create('Rally.data.wsapi.Store', {
                    model : model_name,
                    fetch : model_fields,
                    filters : filters
            }).load({
                callback : function(records, operation, successful)
                {
                    if (successful)
                    {
                        deferred.resolve(records);
                    } else
                    {
                        deferred.reject('Problem loading: ' + operation.error.errors.join('. '));
                    }
                }
            });
            return deferred.promise;
        },
        _displayGrid : function(store, field_names)
        {
            this.remove('workqueue');
            this.add({
                    xtype : 'rallygrid',
                    itemId : 'workqueue',
                    enableBulkEdit : true,
                    store : store,
                    sorters : {
                            property : 'Rank',
                            direction : 'ASC'
                    },
                    columnCfgs : [
                                    {
                                            text : 'ID',
                                            dataIndex : 'FormattedID',
                                            width : 100,
                                            xtype : 'templatecolumn',
                                            tpl : Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                                    },
                                    {
                                            text : 'Name',
                                            width : 400,
                                            dataIndex : 'Name'
                                    },
                                    {
                                            text : 'State',
                                            dataIndex : '__State'
                                    }
                    ]
            });
        },
        _releaseChanged : function(release)
        {
            if (this.currentTimebox === null || release.get('Name') != this.currentTimebox.get('Name'))
            {
                this.currentTimebox = release;
                var releaseStartFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : 'PlannedEndDate',
                        operator : '>=',
                        value : Rally.util.DateTime.toIsoString(release.get('ReleaseStartDate'))
                });
                var releaseEndFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : 'PlannedEndDate',
                        operator : '<=',
                        value : Rally.util.DateTime.toIsoString(release.get('ReleaseDate'))
                });
                var portfolioTimeboxFilter = releaseEndFilter.and(releaseStartFilter);
                var storyFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : 'Release.Name',
                        value : release.get('Name')
                });
                this.getContext().setTimeboxScope(release, 'release');
                this._updateBoard(portfolioTimeboxFilter, storyFilter);
            }
        },
        _iterationChanged : function(iteration)
        {
            if (this.currentTimebox === null || iteration.get('Name') != this.currentTimebox.get('Name'))
            {
                this.currentTimebox = iteration;
                var iterationStartFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : 'PlannedEndDate',
                        operator : '>=',
                        value : Rally.util.DateTime.toIsoString(iteration.get('StartDate'))
                });
                var iterationEndFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : 'PlannedEndDate',
                        operator : '<=',
                        value : Rally.util.DateTime.toIsoString(iteration.get('EndDate'))
                });
                var portfolioTimeboxFilter = iterationStartFilter.and(iterationEndFilter);
                var storyFilter = Ext.create('Rally.data.wsapi.Filter', {
                        property : 'Iteration.Name',
                        value : iteration.get('Name')
                });
                this.getContext().setTimeboxScope(iteration, 'iteration');
                this._updateBoard(portfolioTimeboxFilter, storyFilter);
            }
        }
});