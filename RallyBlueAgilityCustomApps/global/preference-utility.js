Ext.define('Rally.PreferenceUtility', {
        constructor : function(config)
        {
            Ext.apply(this, config);
            var wip_key = "cigna.global-wip-limit";
        },
        getPreferences : function(appID, key)
        {
            // me.logger.log("Getting key=" + key + " for " + appID);
            Rally.data.PreferenceManager.load({
                    appID : appID,
                    filterByName : key,
                    success : function(prefs)
                    {
                        this.// me.logger.log("prefs", prefs);
                        if (prefs && prefs[key])
                        {
                            var values = Ext.JSON.decode(prefs[key]);
                            console.// me.logger.log(values);
                            return values;
                        }
                    }
            });
        },
        setPreferences : function(appID, key, preferences)
        {
            // me.logger.log("Setting preferences for" + appID, preferences);
            var settings = {};
            settings[key] = Ext.JSON.encode(preferences);
            Rally.data.PreferenceManager.update({
                    appID : appID,
                    settings : settings,
                    scope : this,
                    success : function(updatedRecords, notUpdatedRecord, options)
                    {
                        me.// me.logger.log('success', me.getContext().getWorkspace(), updatedRecords, notUpdatedRecord, options);
                    }
            });
        },
        setWipLimits : function(project, limits)
        {
            // me.logger.log("Setting wip limit of " + limit + " for project: " + project);
            Rally.data.PreferenceManager.update({
                    workspace : this.getContext().getWorkspace(),
                    settings : settings,
                    scope : this,
                    success : function(updatedRecords, notUpdatedRecord, options)
                    {
                        me.// me.logger.log('success', me.getContext().getWorkspace(), updatedRecords, notUpdatedRecord, options);
                        if (notUpdatedRecord.length > 0)
                        {
                            // We need to intervene and save directly
                            me.// me.logger.log('PreferenceManager update did not work;  Saving preferences directly.');
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
            // me.logger.log("Getting wip limit for project: " + project);
            Rally.data.PreferenceManager.load({
                    workspace : this.getContext().getWorkspace(),
                    filterByName : key,
                    success : function(prefs)
                    {
                        this.// me.logger.log("prefs", prefs);
                        if (prefs && prefs[key])
                        {
                            var values = Ext.JSON.decode(prefs[key]);
                            console.// me.logger.log(values);
                            me.down('#field_values').setValue(values.join('\r\n'));
                        }
                    }
            });
        },
        getWipLimits : function()
        {
            // me.logger.log("Getting all wip limits");
            Rally.data.PreferenceManager.load({
                    workspace : this.getContext().getWorkspace(),
                    filterByName : key,
                    success : function(prefs)
                    {
                        this.// me.logger.log("prefs", prefs);
                        if (prefs && prefs[key])
                        {
                            var values = Ext.JSON.decode(prefs[key]);
                            console.// me.logger.log(values);
                            me.down('#field_values').setValue(values.join('\r\n'));
                        }
                    }
            });
        }
});