Ext.define('field-maintenance', {
        extend : 'Rally.app.App',
        requires : [
            'Rally.ui.gridboard.plugin.GridBoardFieldPicker'
        ],
        componentCls : 'app',
        launch : function()
        {
            var me = this;
            var field_names = [
                            'Name',
                            'State',
                            'FormattedID',
                            'PortfolioItemTypeName',
                            'PlannedStartDate',
                            'PlannedEndDate',
                            'AcceptanceCriteria',
                            'Release',
                            'Iteration',
                            'Owner.UserName',
                            'Parent',
                            'Feature',
                            'c_ValueMetricKPI',
                            'Blocked',
                            'BlockedReason',
                            'ScheduleState'
            ];
            var no_owner = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Owner',
                    value : null
            });
            var no_acceptance = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'c_AcceptanceCriteria',
                    value : null
            });
            var no_iteration = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Iteration',
                    value : null
            });
            var iteration_exists = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Iteration',
                    operation : '!=',
                    value : null
            });
            var no_release = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Release',
                    value : null
            });
            var release_exists = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Release',
                    operation : '!=',
                    value : null
            });
            var no_parent = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Parent',
                    value : null
            });
            var no_parent_feature = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Feature',
                    value : null
            });
            var no_portfolio_metric_filter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'c_ValueMetricKPI',
                    value : null
            });
            var no_story_metric_filter = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'c_StoryValueMetricKPI',
                    value : null
            });
            var blocked = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'Blocked',
                    value : true
            });
            var no_blocked_reason = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'BlockedReason',
                    value : null
            });
            var is_feature = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'PortfolioItemType.Name',
                    value : 'Feature'
            });
            var no_planned_start = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'PlannedStartDate',
                    value : null
            });
            var no_planned_end = Ext.create('Rally.data.wsapi.Filter', {
                    property : 'PlannedEndDate',
                    value : null
            });
            var no_owner_story_filter = no_owner.and(iteration_exists);
            var no_blocked_reason_filter = blocked.and(no_blocked_reason);
            var no_release_filter = iteration_exists.and(no_release);
            var no_acceptance_criteria_filter = iteration_exists.and(no_acceptance);
            var no_parent_for_story_filter = no_parent.and(no_parent);
            var no_parent_for_portfolio_filter = is_feature.and(no_parent);
            var story_filter = no_owner_story_filter.or(no_blocked_reason_filter).or(no_release_filter).or(no_acceptance_criteria_filter).or(no_parent_for_story_filter).or(no_story_metric_filter);
            var portfolio_filter = no_owner.or(no_portfolio_metric_filter).or(no_parent_for_portfolio_filter).or(no_planned_end).or(no_planned_start);
            var queries_to_run = {
                    'PortfolioItem' : portfolio_filter,
                    'HierarchicalRequirement' : story_filter
            };
            // me.logger.log('Queries made...');
            var promises = [];
            Ext.Object.each(queries_to_run, function(model_name, add_filter)
            {
                var p = function()
                {
                    // me.logger.log('Loading ' + model_name);
                    return me._loadAStoreWithAPromise(model_name, field_names, add_filter);
                };
                promises.push(p);
            });
            Deft.Chain.sequence(promises).then({
                    scope : this,
                    success : function(results)
                    {
                        // me.logger.log("Processing results");
                        var records = Ext.Array.flatten(results);
                        var finalRecords = [];
                        Ext.Array.each(records, function(record)
                        {
                            var issueCount = 0;
                            var issue = '';
                            if (record.get('Owner') === null)
                            {
                                issue += '<li>No Owner set</li>';
                                issueCount++;
                            }
                            if (me._isEmpty(record.get('c_ValueMetricKPI')))
                            {
                                issue += '<li>No Value Metric defined</li>';
                                issueCount++;
                            }
                            if (record.get('Blocked') === true && me._isEmpty(record.get('BlockedReason')))
                            {
                                issue += '<li>No Blocked Reason</li>';
                                issueCount++;
                            }
                            if (record.get('PortfolioItemTypeName'))
                            {
                                record.set('__Type', record.get('PortfolioItemTypeName'));
                                if (record.get('PortfolioItemTypeName') == 'Feature' && me._isEmpty(record.get('Parent')))
                                {
                                    issue += '<li>No Parent</li>';
                                    issueCount++;
                                }
                                if (me._isEmpty(record.get('PlannedStartDate')))
                                {
                                    issue += '<li>No Planned Start Date</li>';
                                    issueCount++;
                                }
                                if (me._isEmpty(record.get('PlannedEndDate')))
                                {
                                    issue += '<li>No Planned End Date</li>';
                                    issueCount++;
                                }
                            } else
                            {
                                record.set('__Type', 'User Story');
                                if (me._isEmpty(record.get('Iteration')) && me._isEmpty(record.get('Release')))
                                {
                                    issue += '<li>No Release defined</li>';
                                    issueCount++;
                                }
                                if (me._isEmpty(record.get('c_AcceptanceCriteria')))
                                {
                                    issue += '<li>No Acceptance Criteria</li>';
                                    issueCount++;
                                }
                                if (me._isEmpty(record.get('Parent')) && me._isEmpty(record.get('Feature')))
                                {
                                    issue += '<li>No Parent</li>';
                                    issueCount++;
                                }
                            }
                            if (issueCount > 0)
                            {
                                issue = '<ul>' + issue + '</ul>';
                                record.set('__Issue', issue);
                                record.set('__IssueCount', issueCount);
                                finalRecords.push(record);
                            }
                        });
                        var store = Ext.create('Rally.data.custom.Store', {
                                data : finalRecords,
                                sorters : {
                                        property : '__IssueCount',
                                        direction : 'DESC'
                                }
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
        _isEmpty : function(record)
        {
            return _.isNull(record) || _.isUndefined(record);
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
            this.add({
                    xtype : 'rallygrid',
                    enableBulkEdit : true,
                    store : store,
                    columnCfgs : [
                                    {
                                            text : 'ID',
                                            dataIndex : 'FormattedID',
                                            width : 100,
                                            xtype : "templatecolumn",
                                            tpl : Ext.create("Rally.ui.renderer.template.FormattedIDTemplate")
                                    },
                                    {
                                            width : 400,
                                            dataIndex : 'Name'
                                    },
                                    {
                                            text : 'Owner',
                                            dataIndex : 'Owner.UserName'
                                    },
                                    {
                                            text : 'Issue(s)',
                                            width : 200,
                                            dataIndex : '__Issue'
                                    }
                    ]
            });
        }
});