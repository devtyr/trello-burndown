/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var required_trello = require('trello');
var rest = require('restler');
var errors = require('./errors');

String.prototype.trim = function() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/,'');};

var CardReceiver = function(applicationKey, userToken, boardId) {
	if (!applicationKey) {
		throw new Error(errors.MISSING_APP_KEY);
	}
	if (!userToken) {
		throw new Error(errors.MISSING_USER_TOKEN);
	}
	if (!boardId) {
		throw new Error(errors.MISSING_BOARD_ID);
	}
	this.trello = new required_trello(applicationKey, userToken);
	this.boardId = boardId;
}

/*
 * Generates Markdown output with data from trello for the given lists
 */
CardReceiver.prototype.receive = function(lists, callback) {
	var me = this;

	me.getLists('all', function(listsError, foundLists) {
		if (listsError) {
			callback(listsError);
			return;
		}

		if (foundLists.indexOf("invalid id") > -1 || foundLists.indexOf("invalid key") > -1) {
			callback(new Error('No lists found. This might be due to an invalid board id or access token.'));
			return;
		}

		var releaseNotesCards = [];
		var listsToHandle = [];

		try {
			lists.forEach(function (list) {
				listId = findListId(foundLists, list);
				if (listId) {
					listsToHandle.push(listId);
				}
			});
		} catch (findError) {
			callback(findError);
		}

		if (listsToHandle.length > 0) {
			var index = 0;
			listsToHandle.forEach(function(list) {
				me.getListCards(list, function(error, cards) {
					if (error) {
						callback(error);
					} else {
						for (var i = 0; i < cards.length; i++) {
							releaseNotesCards.push(cards[i]);
						}

						index++;

						if (index === listsToHandle.length) {
							callback(null, releaseNotesCards);
						}
					}
				});

			});
		}
	}); 
}

CardReceiver.prototype.getLists = function(filter, callback) {
	var cardQuery = this.trello.createQuery();
	cardQuery.filter = filter;
	makeRequest(rest.get, this.trello.uri + '/1/boards/' + this.boardId + '/lists', { query: cardQuery }, callback);
}

CardReceiver.prototype.getListCards = function(listId, callback) {
	var cardQuery = this.trello.createQuery();
	cardQuery.actions = 'updateCard';
	makeRequest(rest.get, this.trello.uri + '/1/lists/' + listId + '/cards', { query: cardQuery }, callback);
}

function makeRequest(fn, uri, options, callback) {
    fn(uri, options)
        .on('complete', function (result) {
            if (result instanceof Error) {
                callback(result);
            } else {
                callback(null, result);
            }
        });
}

function findListId(lists, listName) {
	for (var i = 0; i < lists.length; i++) {
		if (lists[i].name.toLowerCase().trim() === listName.toLowerCase().trim()) {
			return lists[i].id;
		}
	}
	throw new Error(errors.NO_SUCH_LIST);
}

module.exports = CardReceiver;