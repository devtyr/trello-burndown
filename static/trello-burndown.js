function Sprint() {
	this.name = ko.observable('');
	this.dates = ko.observableArray([]);
	this.finishedList = ko.observable('');
	this.lists = ko.observableArray([]);
	this.standupMeeting = ko.observable();
};

function SprintViewModel() {
	// Data
	var self = this;
	self.sprint = new Sprint();
	// Operations
	self.addSprint = function() {
		// add here
		alert("did it");
		// reset
		self.sprint = new Sprint();
	};
};

ko.applyBindings(new SprintViewModel());