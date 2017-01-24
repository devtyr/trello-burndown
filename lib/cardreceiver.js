/*
 * Trello burndown chart generator
 *
 * Author: Norbert Eder <wpfnerd+nodejs@gmail.com>
 */

var required_trello = require('trello');
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
	this.applicationKey = applicationKey;
	this.userToken = userToken;
	this.boardId = boardId;
};

/*
 * Generates Markdown output with data from trello for the given lists
 */
CardReceiver.prototype.receive = function(lists, receive_callback) {
	var me = this;
	var trello = new required_trello(this.applicationKey, this.userToken);
	var releaseNotesCards = [];
	var listsToHandle = [];

	trello.getListsOnBoardByFilter(this.boardId, 'open', function(listsError, foundLists) {
		if (listsError) {
			receive_callback(listsError);
		} else if (foundLists.indexOf("invalid id") > -1 || foundLists.indexOf("invalid key") > -1) {
			receive_callback(new Error('No lists found. This might be due to an invalid board id or access token.'));
		} else {
			try {
				lists.forEach(function (list) {
					listId = findListId(foundLists, list);
					if (listId) {
						listsToHandle.push(listId);
					}
				});

				if (listsToHandle.length > 0) {
					var index = 0;
					listsToHandle.forEach(function(list) {
						var trelloInner = new required_trello(me.applicationKey, me.userToken);
						trelloInner.getCardsForList(list, 'updateCard', function(error, cards) {
							if (cards) {
								for (var i = 0; i < cards.length; i++) {
									releaseNotesCards.push(cards[i]);
								}
							}

							index++;

							if (index === listsToHandle.length) {
								receive_callback(null, releaseNotesCards);
							}
						});
					});
				}
			} catch (findError) {
				receive_callback(findError);
				return;
			}
		}
	}); 
	trello = null;
};

function findListId(lists, listName) {
	for (var i = 0; i < lists.length; i++) {
		if (lists[i].name.toLowerCase().trim() === listName.toLowerCase().trim()) {
			return lists[i].id;
		}
	}
	throw new Error(errors.NO_SUCH_LIST);
}

module.exports = CardReceiver;