Ext.define('clarity-grid', {
    extend: 'Rally.app.App',
    layout: {
        type: "fit"
    },
    logger: new Rally.debug.logger(),
    mixins: [
        'Rally.Messageable'
    ],
    launch: function() {
        this._updateBoard();
    },
    _updateBoard: function(portfolioTimeboxFilter, storyTimeboxFilter) {
        me = this;
        var projectStore = Ext.create('Rally.data.wsapi.Store', {
            model: 'project',
            fetch: [
                'Name',
                'Workspace'
            ],
            limit: Infinity
        });
        projectStore.on('load', this._onProjectsLoaded, this);
        projectStore.load();
    },
    _onProjectsLoaded: function(store, projects) {
        var me = this;
        me.logger.log("store, projects", store, projects);
        me.values = [];
        _.each(projects, function(project) {
            //            me.logger.log("Looking at project: ", project);
            //            var projectWorkspace = project.get("Workspace");
            //            me.logger.log("projectWorkspace: ", projectWorkspace);
            //            if (projectWorkspace._refObjectUUID == this.getContext().getWorkspace()._refObjectUUID) {
            var value = {};
            value.project = project.get("Name");
            value.clarityID = "";
            me.values.push(value);
            //            }
        }, this);
        me.newStore = Ext.create('Rally.data.custom.Store', {
            data: me.values,
            sorters: {
                property: 'project',
                direction: 'ASC'
            }
        });
        me.logger.log("New Store, values", me.newStore, me.values);
        _.each(me.values, function(row) {
            me.logger.log("Getting clarity id: ", row);
            me._getClarityRecordID(row.project);
        });
        me.newStore.addListener('update', function(store, record, op, fieldNames, eOpts) {
            if (op == 'edit') {
                var project = record.get("project");
                var value = record.get('clarityID');
                me.logger.log("record, project, value", record, project, value);
                me._setClarityRecordID(project, value);
            }
        }, store, {
            // single: true
        });
        this._displayGrid(me.newStore);
    },
    _displayGrid: function(store) {
        var that = this;
        this.remove('claritylist');
        this.add({
            xtype: 'rallygrid',
            itemId: 'claritylist',
            enablebulkeditable: true,
            enableEditing: true,
            store: store,
            columnCfgs: [{
                text: 'Project',
                dataIndex: 'project',
                flex: 6,
                align: 'center'
            }, {
                text: 'Clarity Work Record ID',
                dataIndex: 'clarityID',
                flex: 0.8,
                editor: {
                    xtype: 'textfield'
                },
                align: 'center'
            }]
        });
    },
    _setClarityRecordID: function(project, clarityID) {
        var key = this._getClarityKey(project);
        var settings = {};
        settings[key] = Ext.JSON.encode(clarityID);
        me.logger.log("Setting Clarity ID, key, ID: ", key, clarityID);
        var workspace = this.getContext().getWorkspace();
        Rally.data.PreferenceManager.update({
            filterByName: key,
            workspace: workspace,
            settings: settings
        }).then({
            success: function(updatedRecords, notUpdatedRecord, options) {
                me.logger.log("Wrote Clarity ID: ", key, settings, updatedRecords, notUpdatedRecord, options);
            },
            failure: function() {
                me.logger.log("Failed to write preference: ", key, settings);
            }
        });
    },
    _getClarityKey: function(project) {
        return 'clarity-work-record-id:' + project;
    },
    _getClarityRecordID: function(project) {
        var me = this;
        var key = this._getClarityKey(project);
        var workspace = this.getContext().getWorkspace();
        me.logger.log('project, key ', project, key);
        Rally.data.PreferenceManager.load({
            filterByName: key,
            workspace: workspace,
            success: function(prefs) {
                me.logger.log("getClarityRecordID success, prefs: ", prefs);
                if (prefs && prefs[key]) {
                    var value = prefs[key];
                    var row = _.find(me.values, function(r) {
                        return r.project === project;
                    });
                    row.clarityID = Ext.JSON.decode(value);
                    me.logger.log("_getClarityRecordID: key, prefs, row, value", key, prefs, row, value);
                    me.newStore.load();
                }
            },
            failure: function() {
                me.logger.log("Failed to get Clarity ID: ", key);
            }
        });
    }
});
