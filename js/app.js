// Main elements
let content = $('#content');
let wordInput = $('#word-input');
let mainScreen = $('#main-screen');

// TODO need a neater way to manage state
// TODO radix/prefix tree for wordlists


// TODO https://github.com/dwyl/english-words?tab=readme-ov-file
// TODO move page to recently added word location

let currentRoom = {
	// Default dummy room before loading from storage/populating from dialog
	starttime: null,
	updtime: null,
	endtime: null,
	room_ID: "", 
	wordlist: "frequency_en_50k", 
	word_meta: null, 
	guessed_words: {},
	difficulty: 100.0,
	got_words: 0,
	total_words: 0,
	language: 'en',
	wrong_words: 0,
	players: ['localhost'],
	score: 0.0
};

let currentWordListRaw = null;

// Side panel
let roomIdText = $('#room-id');
let roomWordlistText = $('#selected-wordlist');
let roomDifficultyText = $('#selected-difficulty');
let roomTimeLeftText = $('#time-left');
let roomScoreText = $('#score-field');
let roomGotWords = $('#got-words');
let roomTotalWords = $('#total-words');
let roomWordsPercent = $('#words-percent');
let roomWrongWords = $('#wrong-words');
let resetRoomButton = $('#reset-room');
let exportRoomButton = $('#export-room');
let enterWordButton = $('#enter-word');

// New game pop dialog
let popup = $('#new-game-popup');
let dNewId = $('#dialog-new-id');
let dDifficultySlider = $('#dialog-difficulty');
let dDifficultyLabel = $('#dialog-difficulty-label');
dDifficultyLabel.text(dDifficultySlider.val() + '%');
dDifficultySlider.on("input", (event) => {
  	dDifficultyLabel.text(event.target.val() + '%');
});

$('#dialog-play-btn').on("click", (e) => {
  	e.preventDefault();
  	setMainScreenInteractions(true);
  	finalizeNewRoom();
  	popup.close();
  	checkGameRoomExists();
});


// Process entered words
enterWordButton.on('click', (e) => {
	processWordEntry(e);
});

wordInput.on('keydown', (e) => {
	if (e.key === 'Enter')
		processWordEntry(e);
});

resetRoomButton.on('click', (e) => {
  	e.preventDefault();

  	if (window.confirm("Are you sure you want to reset the game?")) {
  		localStorage.clear();
  		location.reload();
  	}
});

exportRoomButton.on('click', (e) => {
  	e.preventDefault();
  	console.log(localStorage.getItem("room"));
});


function processWordEntry(e) {
	e.preventDefault();

	let w = wordInput.val().trim().toLowerCase();
    if (w) {
    	const letter = w.charAt(0);

    	// TODO do this in preprocessing
    	const wordIsValid = wordlist_full[currentRoom.wordlist][letter].slice(0, currentRoom.word_meta[letter]).includes(w);
    	const wordIsNew = !currentRoom.guessed_words[letter].includes(w);

    	if (wordIsValid && wordIsNew) {
	      	currentRoom.guessed_words[letter].push(w);
	      	currentRoom.got_words += 1;
	      	drawNewWord($("#"+letter), w);
	      	updateLetterStats(letter);
	      	// Update timeout
	      	currentRoom.endtime = new Date(Date.now() + (60 * 60 * 24 * 1000));
	    } else if (wordIsNew) {
	    	currentRoom.wrong_words += 1;
	    }

	    updateLocalStorage(); // very costly (or will be in the future!)
	    loadExistingRoomInfo(currentRoom.room_ID); // need that state management upgrade
	    wordInput.val('');
    }
}

function drawNewWord(target, w) {
	const nw = $('<span></span>', {text: w, "class": "word"});
  	target.append(nw);
}

function updateLetterStats(letter) {
	const sc = $("#"+letter).prev();
	const s = $("small", sc);
	s.text('(' + currentRoom.guessed_words[letter].length + '/' + currentRoom.word_meta[letter] + ')');
}

function loadLetterStats(letter) {
	const ndp = $('<div></div>', {"class": "wb"});
	const nd = $('<div></div>', {"class": "wb-inner", "id": letter});
	const sc = $('<span></span>');
	const ct = $('<small></small>', {
		text: '(' + currentRoom.guessed_words[letter].length + '/' + currentRoom.word_meta[letter] + ')'
	});
	const s = $('<h3></h3>', {text: letter.toUpperCase()});

  	sc.append(s);
  	sc.append(ct);
  	ndp.append(sc);
  	ndp.append(nd);
  	content.append(ndp);  	
}

function loadWordsVizArea() {
	const AZ = Object.keys(currentRoom.word_meta).sort().slice(1).join('');
	for (const letter of AZ) {
		loadLetterStats(letter);

		for (const word of currentRoom.guessed_words[letter]) {
  			drawNewWord($("#"+letter), word);
  		}
	}
}

function checkGameRoomExists() {
	const roomID = localStorage.getItem("room_ID");
	if (!roomID) {
		popup.open = true;
		setMainScreenInteractions(false);
		currentRoom.room_ID = getBadRandomID();
		dNewId.text(currentRoom.room_ID);
	} else {
		loadExistingRoomInfo(roomID);
		loadWordsVizArea();
		// loadWordList();
	}
}

function setMainScreenInteractions(enabled) {
	if (enabled) {
		mainScreen.style.opacity = '1.0';
		mainScreen.style.pointerEvents = 'initial';
		mainScreen.style.userSelect = 'initial';
	} else {
		mainScreen.style.opacity = '0.2';
		mainScreen.style.pointerEvents = 'none';
		mainScreen.style.userSelect = 'none';
	}
}

function finalizeNewRoom() {
	const now = Date.now();
	currentRoom.starttime = new Date(now); 
	currentRoom.endtime = new Date(now + (60 * 60 * 24 * 1000));
	currentRoom.updtime = new Date(now);

	currentRoom.wordlist = $('#dialog-wordlist').val();
	currentRoom.difficulty = dDifficultySlider.val();

	// TODO two modes:
	// 1. use difficulty as cap on words sorted by frequency
	// 2. use difficulty as a general cap on # of guessed words (much much easier)
	const dmult = (currentRoom.difficulty / 100.0);
	currentRoom.word_meta = Object.fromEntries(Object.entries(wordlist_meta[currentRoom.wordlist]).map(([k,v]) => [k, Math.round(v*dmult)]));

	currentRoom.total_words = currentRoom.word_meta['_total'];
	currentRoom.guessed_words = Object.fromEntries(Object.entries(currentRoom.word_meta).map(([k,v]) => [k, []]));

	populateLocalStorage();
}

function loadExistingRoomInfo(roomID) {
	wordInput.focus();
	roomIdText.text(roomID);

	currentRoom = JSON.parse(localStorage.getItem("room"));

	roomWordlistText.text(currentRoom.wordlist);
	roomDifficultyText.text(currentRoom.difficulty + '%');

	currentRoom.updtime = new Date(Date.now());
	const t1 = new Date(currentRoom.endtime);
	const dt = Math.round(Math.abs(currentRoom.updtime.getTime() - t1.getTime()) / 3600000);
	if (dt > 1)
		roomTimeLeftText.text(dt);
	else
		roomTimeLeftText.text('<1');

	const gw = parseInt(currentRoom.got_words);
	const tw = parseInt(currentRoom.total_words);
	roomGotWords.text(gw);
	roomTotalWords.text(tw);
	roomWordsPercent.text(((gw/tw)*100).toFixed(2));
	roomWrongWords.text(currentRoom.wrong_words);

	roomScoreText.text(currentRoom.score);
}

function getBadRandomID(length = 8) {
	let res = '';
  	for (let i = 0; i < length; i++) {
  		res += Math.floor(Math.random() * 10);
  	}
  	return res;
}

function calculateScore(w) {
	let freq = wordlist_full[currentRoom.wordlist][w.charAt(0)].indexOf(w);
	let score = w.length * 10 * Math.sqrt(1.0 / (freq+1));
	return score;
}

function populateLocalStorage() {
	localStorage.setItem("room_ID", currentRoom.room_ID);
	localStorage.setItem("room", JSON.stringify(currentRoom));
}

function updateLocalStorage() {
	currentRoom.updtime = new Date(Date.now());
	localStorage.setItem("room", JSON.stringify(currentRoom));
}



$(function(){
	checkGameRoomExists();
	// var App = new AppView;
});
