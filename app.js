// Main elements
let content = document.getElementById('content');
let wordInput = document.getElementById('word-input');
let mainScreen = document.getElementById('main-screen');


// TODO refactor currentRoom out as it's currently the main global
// object, referenced by most functions 
let currentRoom = {
	// Default dummy room before loading from memory
	starttime: null,
	updtime: null,
	endtime: null,
	room_ID: "", 
	wordlist: "frequency_list_50k", 
	difficulty: 100.0,
	got_words: 0,
	total_words: 0,
	language: 'en',
	wrong_words: 0,
	players: ['localhost']
};

// Side panel
let roomIdText = document.getElementById('room-id');
let roomWordlistText = document.getElementById('selected-wordlist');
let roomDifficultyText = document.getElementById('selected-difficulty');
let roomTimeLeftText = document.getElementById('time-left');
let roomGotWords = document.getElementById('got-words');
let roomTotalWords = document.getElementById('total-words');
let roomWordsPercent = document.getElementById('words-percent');
let roomWrongWords = document.getElementById('wrong-words');
let resetRoomButton = document.getElementById('reset-room');

// New game pop dialog
let popup = document.getElementById('new-game-popup');
let dNewId = document.getElementById('dialog-new-id');
let dDifficultySlider = document.getElementById('dialog-difficulty');
let dDifficultyLabel = document.getElementById('dialog-difficulty-label');
dDifficultyLabel.textContent = dDifficultySlider.value + '%';
dDifficultySlider.addEventListener("input", (event) => {
  	dDifficultyLabel.textContent = event.target.value + '%';
});
document.getElementById('dialog-play-btn').addEventListener("click", (e) => {
  	e.preventDefault();
  	setMainScreenInteractions(true);
  	finalizeNewRoom();
  	popup.close();
  	checkGameRoomExists();
});


// Process entered words
wordInput.addEventListener('keydown', function (e) {
	let w = wordInput.value.toLowerCase();
    if (e.key === 'Enter' && w) {
      	const targetBox = document.getElementById(w.charAt(0));
      	const nw = document.createElement('span');
      	nw.innerText = w;
      	nw.classList.add('word');

      	targetBox.appendChild(nw);
      	wordInput.value = '';
    }
});

resetRoomButton.addEventListener("click", (e) => {
  	e.preventDefault();
  	localStorage.clear();
  	location.reload();
});


function loadLettersArea() {
	const AZ = Object.keys(wordlist_meta[currentRoom.wordlist]).sort().slice(1).join('');
	for (const letter of AZ) {
		const ndp = document.createElement('div');
		ndp.classList.add('wb');

		const nd = document.createElement('div');
		nd.id = letter;
		nd.classList.add('wb-inner');

		const sc = document.createElement('span');
		const ct = document.createElement('small');
		ct.textContent = '(0/' + wordlist_meta[currentRoom.wordlist][letter] + ')';
		const s = document.createElement('h3');
	  	s.textContent = letter.toUpperCase();

	  	sc.appendChild(s);
	  	sc.appendChild(ct);
	  	ndp.appendChild(sc);
	  	ndp.appendChild(nd);
	  	content.appendChild(ndp);
	}
}

function checkGameRoomExists() {
	const roomID = localStorage.getItem("room_ID");
	if (!roomID) {
		popup.open = true;
		setMainScreenInteractions(false);
		currentRoom.room_ID = getBadRandomID();
		dNewId.innerText = currentRoom.room_ID;
	} else {
		setUpExistingRoom(roomID);
		loadLettersArea();
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

	currentRoom.wordlist = document.getElementById('dialog-wordlist').value;
	currentRoom.difficulty = dDifficultySlider.value;

	loadWordList();
	populateLocalStorage();
}

function setUpExistingRoom(roomID) {
	wordInput.focus();
	roomIdText.textContent = roomID;
	roomWordlistText.textContent = localStorage.getItem("wordlist");
	roomDifficultyText.textContent = localStorage.getItem("difficulty") + '%';

	currentRoom.updtime = new Date(Date.now());
	const t1 = new Date(localStorage.getItem('endtime'));
	const dt = Math.round(Math.abs(currentRoom.updtime.getTime() - t1.getTime()) / 3600000);
	if (dt > 1)
		roomTimeLeftText.textContent = dt;
	else
		roomTimeLeftText.textContent = '<1'

	const gw = parseInt(localStorage.getItem('got_words'));
	const tw = parseInt(localStorage.getItem('total_words'));
	roomGotWords.textContent = gw;
	roomTotalWords.textContent = tw;
	roomWordsPercent.textContent = Math.round((gw/tw)*100);
	roomWrongWords.textContent = localStorage.getItem('wrong_words');
}

function getBadRandomID(length = 8) {
	let res = '';
  	for (let i = 0; i < length; i++) {
  		res += Math.floor(Math.random() * 10);
  	}
  	return res;
}

function populateLocalStorage() {
	localStorage.setItem("room_ID", currentRoom.room_ID);
	localStorage.setItem("wordlist", currentRoom.wordlist);
	localStorage.setItem("difficulty", currentRoom.difficulty);
	localStorage.setItem("got_words", currentRoom.got_words);
	localStorage.setItem("total_words", currentRoom.total_words);
	localStorage.setItem("wrong_words", currentRoom.wrong_words);
	localStorage.setItem("starttime", currentRoom.starttime);
	localStorage.setItem("updtime", currentRoom.updtime);
	localStorage.setItem("endtime", currentRoom.endtime);
}

function loadWordList() {
	// TODO set up tree
	const wlist = currentRoom.wordlist + '.txt';

	fetch(wlist)
	  .then((res) => res.text())
	  .then((text) => {
	  		// TODO filter out up to difficulty% for each letter
	    	console.log(wordlist_meta[currentRoom.wordlist]);
	   })
	  .catch((e) => console.error(e));

	currentRoom.total_words = wordlist_meta[currentRoom.wordlist]['_total'];
}

checkGameRoomExists();
