function Sprint() {
	this.name = ko.observable('');
	this.boardId = ko.observable('');
	this.dates = ko.observableArray([]);
	this.finishedList = ko.observable('');
	this.lists = ko.observableArray([]);
	this.standupMeeting = ko.observable();

	this.clear = function() {
		this.name('');
		this.boardId('');
		this.dates([]);
		this.finishedList('');
		this.lists([]);
		this.standupMeeting();		
	}

	this.resetIncludes = function() {
		for (var i = 0; i < this.dates().length; i++) {
			this.dates()[i].include(false);
		}
	}
};

function SprintDayDefinition(data) {
	var self = this;
	self.day = ko.observable(data.day);
	self.isWorkDay = ko.observable(data.isWorkDay);
	self.includePlain = ko.observable(data.include);
	self.include = ko.computed({
		read: function() {
			return self.includePlain();
		},
		write: function(value) {
			self.includePlain(value);
			if (!value)
				self.isWorkDay(value);
		},
		scope: self
	});
}

function SprintViewModel() {
	// Data
	var self = this;
	self.sprint = new Sprint();
	self.currentList = ko.observable('');
	self.boardId = ko.observable('');
	self.message = ko.observable('');
	self.isErrorMessageVisible = ko.observable(false);
	self.isInfoMessageVisible = ko.observable(false);
	self.dateRangePlain = ko.observable('');
	self.dateRange = ko.computed({
		read: function() {
			return self.dateRangePlain();
		},
		write: function(value) {
			var splitted = value.split(' - ');
			var startDate = new Date(Date.parse(splitted[0]));
			var endDate = new Date(Date.parse(splitted[1]));

			if (startDate && endDate) {
				self.clearDays();

				var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
				var diffDays = Math.round(Math.abs((startDate.getTime() - endDate.getTime())/(oneDay))) + 1;

				var dateItems = '';
				for (var i = 0; i < diffDays; i++) {
					var currentDate = new Date(startDate);
					currentDate.setDate(startDate.getDate() + i);

					var isWorkDay = false;
					var include = false;
					if (i > 0 && i < (diffDays - 1) && currentDate.getDay() > 0 && currentDate.getDay() < 6) {
						isWorkDay = true;
					}
					if (currentDate.getDay() > 0 && currentDate.getDay() < 6) {
						include = true;
					}

					self.addSprintDay(currentDate.toString("yyyy-MM-dd"), isWorkDay, include);
				}
			}
		},
		owner: this
	});

	//bind for error message hide/show
	$(function(){
	    $("[data-hide]").on("click", function(){
	        //$(this).closest("." + $(this).attr("data-hide")).hide();
	        self.isErrorMessageVisible(false);
	    });
	});

	// Operations
	self.addSprint = function() {
		var dataToSend = ko.toJSON(self.sprint);
		dataToSend.standupMeeting += ":00Z";
		$.ajax({
		  type: "POST",
		  url: "/manage/add",
		  data: dataToSend,
		}).done(function( msg ) {
		  self.sprint.clear();
		  self.message('Added successfully.');
		  self.isInfoMessageVisible(true);
		}).fail(function(jqXHR, textStatus) {
			self.message(textStatus);
			self.isErrorMessageVisible(true);
		});
	};

	self.updateSprint = function() {		
		var dataToSend = ko.toJSON(self.sprint);
		dataToSend.standupMeeting += ":00Z";
		$.ajax({
			type: "PUT",
			url: "/manage/edit",
			data: dataToSend,
		}).done(function(msg) {
			self.message("Updated successfully");
			self.isInfoMessageVisible(true);
		}).fail(function(jqXHR, textStatus) {
			self.message(textStatus);
			self.isErrorMessageVisible(true);
		});
	};

	self.getDateRange = function(data) {
		var retVal = '';
		if (data) {
			retVal = {
				startDate: new Date(Date.parse(data.dates[0].day)),
				endDate: new Date(Date.parse(data.dates[data.dates.length - 1].day))
			};
		} else if (self.sprint && self.sprint.dates().length) {
			retVal = {
				startDate: new Date(Date.parse(self.sprint.dates()[0].day())),
				endDate: new Date(Date.parse(self.sprint.dates()[self.sprint.dates().length - 1].day()))
			};
		}
		return retVal;
	}

	self.loadSprint = function(name, callback) {
		$.ajax({
			type: "GET",
			url: "/api/sprint?sprint=" + name
		}).done(function(msg) {
			var data = JSON.parse(msg);

			callback(self.getDateRange(data));

			self.sprint.resetIncludes();

			self.sprint.name(data.name);
			self.sprint.boardId(data.boardId);
			self.sprint.finishedList(data.finishedList);

			if (data.standupMeeting)
				self.sprint.standupMeeting(data.standupMeeting.substring(0,5));

			for (var i = 0; i < data.dates.length; i++) {
				self.updateSprintDay(data.dates[i].day, data.dates[i].isWorkDay, data.dates[i].include);
			}

			//call addSpringList during load only if there are lists to show
			if (data.lists.length>0 && data.lists[0].name != "") {
				for (var i = 0; i < data.lists.length; i++) {
					self.currentList(data.lists[i].name);
					self.addSprintList();
				}
			}

		}).fail(function(jqXHR, textStatus) {
			self.message("Sprint could not be loaded");
			self.isErrorMessageVisible(true);
		});
	};

	self.addSprintDay = function(date, isWorkDay, include) {
		if (!include) {
			isWorkDay = false;
		}
		self.sprint.dates.push(new SprintDayDefinition({ day: date, isWorkDay: isWorkDay, include: include }));
	};

	self.updateSprintDay = function(date, isWorkDay, include) {
		if (!include) {
			isWorkDay = false;
		}
		for (var i = 0; i < self.sprint.dates().length; i++) {
			if (self.sprint.dates()[i].day() == date) {
				self.sprint.dates()[i].isWorkDay(isWorkDay);
				self.sprint.dates()[i].include(include);
			}
		}
	}

	self.clearDays = function() {
		self.sprint.dates.removeAll();
	};

	self.addSprintList = function() {
		if (self.currentList() === undefined || self.currentList() == "") {
			self.isErrorMessageVisible(true);
			self.message("List name can't be empty!");
			return;
		}
		self.sprint.lists.push({ name: self.currentList() });
		self.currentList("");
	};

	self.removeSprintList = function(sprintList) {
		self.sprint.lists.remove(sprintList);
	};
};

var sprintViewModel = new SprintViewModel();
ko.applyBindings(sprintViewModel);
