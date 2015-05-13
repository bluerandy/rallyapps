Ext.define('wip-limits', {
        extend : 'Rally.app.App',
        mixins : [
            'Rally.Messageable'
        ],
        launch : function()
        {
            this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
            this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
            this._updateBoard();
        },
        _updateBoard : function(portfolioTimeboxFilter, storyTimeboxFilter)
        {
            var me = this;
            var model = Rally.data.ModelFactory.getModel({
                    type : 'UserStory',
                    scope : this
            });
            var store = Ext.create('Rally.data.wsapi.Store', {
                    model : 'hierarchicalrequirement',
                    fetch : [
                                    'Name',
                                    'FormattedID',
                                    'Project',
                                    'ScheduleState'
                    ],
                    limit : Infinity
            });
            store.on('load', this._onStoriesLoaded, this);
            store.load();
        },
        _onStoriesLoaded : function(store, stories)
        {
            var wip_test = [];
            var tmp = {};
            tmp["project"] = "IA-Program > IA Project Governance & Leadership";
            tmp["In-Progress"] = 10;
            tmp["Completed"] = 5;
            wip_test.push(tmp);
            var g = _.groupBy(stories, function(t)
            {
                return t.get("Project") ? t.get("Project")._refObjectName : "none";
            });
            // console.log("Group: ", g);
            var summaries = _.map(_.keys(g), function(key)
            {
                var stories = g[key];
                // console.log("Stories: ", stories);
                var counts = _.countBy(stories, function(story)
                {
                    return story.get('ScheduleState');
                });
                var values = {};
                _.each([
                                'Backlog',
                                'Defined',
                                'In-Progress',
                                'Completed',
                                'Accepted'
                ], function(state)
                {
                    values[state] = _.isUndefined(counts[state]) ? 0 : counts[state];
                });
                _.each(wip_test, function(wip)
                {
                    if (wip['project'] == key)
                    {
                        values["in-progress-wip"] = wip['In-Progress'];
                        values["completed-wip"] = wip['Completed'];
                        values['defined-wip'] = 0;
                    } else
                    {
                        values["in-progress-wip"] = 0;
                        values["completed-wip"] = 0;
                        values['defined-wip'] = 0;
                    }
                });
                values["project"] = key;
                // console.log("Counts: ", counts);
                return values;
            });
            console.log("Summaries: ", summaries);
            var newStore = Ext.create('Rally.data.custom.Store', {
                    data : summaries,
                    listeners : {
                        update : function(store, record, op, fieldNames, eOpts)
                        {
                            console.log("rec:", op, record, fieldNames);
                        }
                    }
            });
            this._displayGrid(newStore);
        },
        _displayGrid : function(store)
        {
            this.remove('workqueue');
            this.add({
                    xtype : 'rallygrid',
                    itemId : 'workqueue',
                    enablebulkeditable : true,
                    enableEditing : true,
                    store : store,
                    columnCfgs : [
                                    {
                                            text : 'Project',
                                            dataIndex : 'project'
                                    },
                                    {
                                            text : 'Backlog',
                                            dataIndex : 'Backlog'
                                    },
                                    {
                                            text : 'Defined',
                                            dataIndex : 'Defined'
                                    },
                                    {
                                            text : 'Defined Limit',
                                            dataIndex : 'defined-wip',
                                            editor : {
                                                xtype : 'textfield'
                                            }
                                    },
                                    {
                                            text : 'In-Progress',
                                            dataIndex : 'In-Progress'
                                    },
                                    {
                                            text : 'In-Progress Limit',
                                            dataIndex : 'in-progress-wip',
                                            editor : {
                                                xtype : 'textfield'
                                            }
                                    },
                                    {
                                            text : 'Completed',
                                            dataIndex : 'Completed'
                                    },
                                    {
                                            text : 'Completed Limit',
                                            dataIndex : 'completed-wip',
                                            editor : {
                                                xtype : 'textfield'
                                            }
                                    },
                                    {
                                            text : 'Accepted',
                                            dataIndex : 'Accepted'
                                    }
                    ]
            });
        },
        _releaseChanged : function(release)
        {
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
        },
        _iterationChanged : function(iteration)
        {
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
        },
        setWipLimit : function(project, limit)
        {
            console.log("Setting wip limit of " + limit + " for project: " + project);
            Rally.data.PreferenceManager.update({
                    workspace : this.getContext().getWorkspace(),
                    settings : settings,
                    scope : this,
                    success : function(updatedRecords, notUpdatedRecord, options)
                    {
                        me.console.log('success', me.getContext().getWorkspace(), updatedRecords, notUpdatedRecord, options);
                        if (notUpdatedRecord.length > 0)
                        {
                            // We need to intervene and save directly
                            me.console.log('PreferenceManager update did not work;  Saving preferences directly.');
                            me._savePrefs(key, settings[key]).then({
                                failure : function()
                                {
                                    Rally.ui.notify.Notifier.showWarning({
                                        message : 'Options not saved to Preferences.'
                                    });
                                }
                            });
                        } else
                        {
                            Rally.ui.notify.Notifier.show({
                                message : 'Options Saved to Preferences.'
                            });
                        }
                    }
            });
        },
        getWipLimit : function(project)
        {
            console.log("Getting wip limit for project: " + project);
            Rally.data.PreferenceManager.load({
                    workspace : this.getContext().getWorkspace(),
                    filterByName : key,
                    success : function(prefs)
                    {
                        this.console.log("prefs", prefs);
                        if (prefs && prefs[key])
                        {
                            var values = Ext.JSON.decode(prefs[key]);
                            console.console.log(values);
                            me.down('#field_values').setValue(values.join('\r\n'));
                        }
                    }
            });
        },
        getWipLimits : function()
        {
            console.log("Getting all wip limits");
            Rally.data.PreferenceManager.load({
                    workspace : this.getContext().getWorkspace(),
                    filterByName : key,
                    success : function(prefs)
                    {
                        this.console.log("prefs", prefs);
                        if (prefs && prefs[key])
                        {
                            var values = Ext.JSON.decode(prefs[key]);
                            console.console.log(values);
                            me.down('#field_values').setValue(values.join('\r\n'));
                        }
                    }
            });
        }
});