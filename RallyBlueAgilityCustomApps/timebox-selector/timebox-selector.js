Ext.define('rally.app.timebox-selector', {
        extend : 'Rally.app.App',
        componentCls : 'app',
        currentTimebox : null,
        layout : 'hbox',
        width : '100%',
        mixins : [
            'Rally.Messageable'
        ],
        launch : function()
        {
            console.log("timebox launch");
            this.stateId = Rally.environment.getContext().getScopedStateId('timebox-filter');
            this._createReleaseCombo();
            this.subscribe(this, 'requestTimebox', this._requestTimebox, this);
        },
        _requestTimebox : function()
        {
            if (this.currentTimebox !== null)
            {
                if (this.currentTimebox.get('ReleaseDate'))
                {
                    this.publish('timeboxReleaseChanged', this.currentTimebox);
                } else
                {
                    this.publish("timeboxIterationChanged", this.currentTimebox);
                }
            }
        },
        _createReleaseCombo : function()
        {
            console.log("Creating release combo...");
            this._releaseCombo = this.add({
                    xtype : 'rallyreleasecombobox',
                    fieldLabel : 'Program Increment',
                    hideLabel : false,
                    labelPad : 5,
                    labelSeparator : ':',
                    labelWidth : 130,
                    width : 280,
                    labelAlign : 'right',
                    stateful : false,
                    stateId : 'releasecombo',
                    padding : 5,
                    context : Rally.environment.getContext(),
                    showArrows : false,
                    growToLongestValue : true,
                    defaultToCurrentTimebox : true,
                    listeners : {
                            change : function(t, newVal, oldVal, eOpts)
                            {
                                var release = t.getRecord();
                                this.currentTimebox = release;
                                this.publish('timeboxReleaseChanged', release);
                                this._updateIterationCombo(release);
                            },
                            scope : this
                    }
            });
        },
        _updateIterationCombo : function(release)
        {
            console.log("Creating iteration combo...");
            this.remove('globaliterationpicker');
            var endFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : "EndDate",
                    operator : "<=",
                    value : Rally.util.DateTime.toIsoString(release.get('ReleaseDate'))
            });
            var startFilter = Ext.create('Rally.data.wsapi.Filter', {
                    property : "StartDate",
                    operator : ">=",
                    value : Rally.util.DateTime.toIsoString(release.get('ReleaseStartDate'))
            });
            var filters = endFilter.and(startFilter);
            console.log("Filters: ", filters);
            this._iterationCombo = this.add({
                    xtype : 'rallyiterationcombobox',
                    itemId : 'globaliterationpicker',
                    fieldLabel : 'Sprint/Iteration',
                    hideLabel : false,
                    labelPad : 5,
                    labelSeparator : ':',
                    labelWidth : 100,
                    labelAlign : 'right',
                    stateful : false,
                    padding : 5,
                    context : Rally.environment.getContext(),
                    showArrows : false,
                    growToLongestValue : true,
                    stateId : 'iterationcombo',
                    allowBlank : true,
                    allowClear : true,
                    allowNoEntry : true,
                    noEntryText : 'PI Scope',
                    emptyText : 'PI Scope',
                    noEntryValue : null,
                    defaultToCurrentTimebox : false,
                    defaultSelectPosition : 'first',
                    storeConfig : {
                            remoteFilter : true,
                            filters : filters
                    },
                    listeners : {
                            change : function(t, newVal, oldVal, eOpts)
                            {
                                var iteration = t.getRecord();
                                this.currentTimebox = iteration;
                                this.publish('timeboxIterationChanged', iteration);
                            },
                            scope : this
                    }
            });
        }
});