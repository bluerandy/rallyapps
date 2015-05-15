Ext.define('Rally.global.Utils', {
	alias: 'widget.RallyGlobal',
	callback: null,
	caller: null,
	currentTimebox: null,
	constructor: function(caller, callback) {
		this.caller = caller;
		this.callback = callback;
	},
	init: function() {
		this.subscribe(this, 'timeboxReleaseChanged', this._releaseChanged, this);
		this.subscribe(this, 'timeboxIterationChanged', this._iterationChanged, this);
		if (caller.currentTimebox === null) {
			caller.publish('requestTimebox', caller);
		}
	},
	_createReleaseFilter: function(release) {
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
		if (_.isNull(this.currentTimebox) || release.get('Name') != this.currentTimebox.get('Name')) {
			caller.getContext().setTimeboxScope(release, 'release');
			this.currentTimebox = release;
			this.callback(this._createReleaseFilter(release));
		}
	},
	_createIterationFilter: function(iteration) {
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
		if (_.isNull(this.currentTimebox) || iteration.get('Name') != this.currentTimebox.get('Name')) {
			caller.getContext().setTimeboxScope(iteration, 'iteration');
			this.currentTimebox = iteration;
			this.callback(this._createIterationFilter(iteration));
		}
	}
});