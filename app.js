// Main elements
let content = document.getElementById('content');
let wordInput = document.getElementById('word-input');
let mainScreen = document.getElementById('main-screen');



// TODO need a neater way to manage state
// TODO scoring system: based on word frequency/rarity+length+..?
let currentRoom = {
	// Default dummy room before loading from storage/populating from dialog
	starttime: null,
	updtime: null,
	endtime: null,
	room_ID: "", 
	wordlist: "frequency_list_50k", 
	guessed_words: {},
	difficulty: 100.0,
	got_words: 0,
	total_words: 0,
	language: 'en',
	wrong_words: 0,
	players: ['localhost']
};

let currentWordListRaw = null;

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
    	const targetletter = w.charAt(0);
    	const wordIsValid = currentWordListRaw.includes(w);
    	const wordIsNew = !currentRoom.guessed_words[targetletter].includes(w);

    	if (wordIsValid && wordIsNew) {
	      	currentRoom.guessed_words[targetletter].push(w);
	      	currentRoom.got_words += 1;
	      	drawNewWord(document.getElementById(targetletter), w);
	    } else if (wordIsNew) {
	    	currentRoom.wrong_words += 1;
	    }

	    updateLocalStorage(); // very costly (or will be in the future!)
	    loadExistingRoomInfo(currentRoom.room_ID); // need that state management upgrade
	    wordInput.value = '';
    }
});

resetRoomButton.addEventListener("click", (e) => {
  	e.preventDefault();
  	localStorage.clear();
  	location.reload();
});


function drawNewWord(target, w) {
	const nw = document.createElement('span');
  	nw.innerText = w;
  	nw.classList.add('word');
  	target.appendChild(nw);
}


function loadWordsVizArea() {
	const AZ = Object.keys(wordlist_meta[currentRoom.wordlist]).sort().slice(1).join('');
	for (const letter of AZ) {
		const ndp = document.createElement('div');
		ndp.classList.add('wb');

		const nd = document.createElement('div');
		nd.id = letter;
		nd.classList.add('wb-inner');

		const sc = document.createElement('span');
		const ct = document.createElement('small');
		ct.textContent = '(' + currentRoom.guessed_words[letter].length + '/' + wordlist_meta[currentRoom.wordlist][letter] + ')';
		const s = document.createElement('h3');
	  	s.textContent = letter.toUpperCase();

	  	sc.appendChild(s);
	  	sc.appendChild(ct);
	  	ndp.appendChild(sc);
	  	ndp.appendChild(nd);
	  	content.appendChild(ndp);

	  	for (const word of currentRoom.guessed_words[letter]) {
	  		drawNewWord(document.getElementById(letter), word);
	  	}
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
		loadExistingRoomInfo(roomID);
		loadWordsVizArea();
		loadWordList();
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

	currentRoom.total_words = wordlist_meta[currentRoom.wordlist]['_total'];
	currentRoom.guessed_words = Object.fromEntries(Object.entries(wordlist_meta[currentRoom.wordlist]).map(([k,v]) => [k, []]));

	populateLocalStorage();
}

function loadExistingRoomInfo(roomID) {
	wordInput.focus();
	roomIdText.textContent = roomID;

	currentRoom = JSON.parse(localStorage.getItem("room"));

	roomWordlistText.textContent = currentRoom.wordlist;
	roomDifficultyText.textContent = currentRoom.difficulty + '%';

	currentRoom.updtime = new Date(Date.now());
	const t1 = new Date(currentRoom.endtime);
	const dt = Math.round(Math.abs(currentRoom.updtime.getTime() - t1.getTime()) / 3600000);
	if (dt > 1)
		roomTimeLeftText.textContent = dt;
	else
		roomTimeLeftText.textContent = '<1'

	const gw = parseInt(currentRoom.got_words);
	const tw = parseInt(currentRoom.total_words);
	roomGotWords.textContent = gw;
	roomTotalWords.textContent = tw;
	roomWordsPercent.textContent = ((gw/tw)*100).toFixed(2);
	roomWrongWords.textContent = currentRoom.wrong_words;
}

function getBadRandomID(length = 8) {
	let res = '';
  	for (let i = 0; i < length; i++) {
  		res += Math.floor(Math.random() * 10);
  	}
  	return res;
}

function populateLocalStorage() {
	currentRoom.updtime = new Date(Date.now());
	localStorage.setItem("room_ID", currentRoom.room_ID);
	localStorage.setItem("room", JSON.stringify(currentRoom));
}

function updateLocalStorage() {
	localStorage.setItem("room", JSON.stringify(currentRoom));
}

function loadWordList() {
	// TODO set up tree 
	// subtree for each letter?
	fetch(currentRoom.wordlist + '.txt')
	  .then((res) => res.text())
	  .then((text) => {
	  		// TODO filter out up to difficulty% for each letter
	    	console.log(wordlist_meta[currentRoom.wordlist]);

	    	// ugly way to test this for now, string lookup lol
	    	currentWordListRaw = text;
	   })
	  .catch((e) => console.error(e));
}

checkGameRoomExists();
