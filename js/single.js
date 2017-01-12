var listOfWords;
var orderOfWords;
var currentWord = 0;
var totalWords;

var allWords = new Firebase('https://amber-inferno-1192.firebaseio.com/balderDash/words');
var globalVariables = new Firebase('https://amber-inferno-1192.firebaseio.com/balderDash/variables');

$( document ).ready(function() {
	
	//Load word list and determine first word to display (randomly)
	loadWords();
	

	//Activate next and previous buttons
	$("#next").click(next);
	$("#previous").click(previous);

	//Checks if anyone else changes the value of "currentWord so that everyone sees the same thing"
	checkForChanges();
	

});

//Adds word or phrase to the firebase database
function addWord(word,def,example){
	var newWord = allWords.push();
	var path = newWord.toString();
	console.log(path);
	newWord.update({
	    word: word,
	    def: def,
	    example: example,
	    path: path,
	    timeStamp: Firebase.ServerValue.TIMESTAMP
	});
}


//Clicking the next button
function next(){
	console.log("Next was clicked");
	currentWord += 1;
	if (currentWord>(totalWords-1)){
		currentWord = 0;
	}
	updateCurrentWord();
	refreshDisplay();
}

//Clicking the previous button
function previous(){
	console.log("Previous was clicked")
	currentWord -= 1;
	if (currentWord<0){
		currentWord = (totalWords-1);
	}
	updateCurrentWord();
	refreshDisplay();
}


//Refreshes the display based on the current word value
function refreshDisplay(){
	var newWord = listOfWords[currentWord].word;
	var newDef = listOfWords[currentWord].def;
	var newExample = listOfWords[currentWord].example;
	//console.log("Current Word:")
	//console.log(newWord);
	
	$("#word").html(newWord);
	$("#definition").html(newDef);
	$("#example").html(newExample);
}

//This function loads all of the words and definitions from the firebase database to the users local machine
function loadWords(){
	var allWordsList = [];
	var newWord;

	allWords.once('value', function(data) {
  		// Get all points

	data.forEach(function(childSnapshot) {
			allWordsList.push(childSnapshot.val());
			
		});
		
  		

		listOfWords = allWordsList;
		console.log("List of Words");
		console.log(listOfWords);

		totalWords = listOfWords.length;
		determineFirstWord(totalWords);
		

	});

}

// Figure out the first word to display
function determineFirstWord(totalWords){
		console.log("total words:");
		console.log(totalWords);
		
		var currentWordData = globalVariables.child('currentWord');

		currentWordData.once('value',function(snapshot){
			// Get the object of the variable current word data.currentWord and data.timeStamp
			var data = snapshot.val();
			var lastValue = data.currentWord;
			var lastUpdated = data.timeStamp;
			var currentTime = (new Date).getTime();
			var timeDiff = currentTime - lastUpdated;
			//console.log("time diff:");
			//console.log(timeDiff);

			// If the first word hasn't been changed in 30 minutes, generate a new first word
			if (timeDiff>18000000){
				currentWord = Math.floor(Math.random() * totalWords);
				
			} else{
				currentWord = lastValue;

			}

			//Update the firebase values
			updateCurrentWord();

			refreshDisplay();

		});
		
}

//Update the network's value of "current word"
function updateCurrentWord(){
	var currentWordData = globalVariables.child('currentWord');
	currentWordData.update({
	    currentWord: currentWord,
	    timeStamp: Firebase.ServerValue.TIMESTAMP
	});
}

// Checks for changes to the 
function checkForChanges(){
	var currentWordData = globalVariables.child('currentWord');

	currentWordData.on('value',function(snapshot){
			// Get the object of the variable current word data.currentWord and data.timeStamp
			var data = snapshot.val();
			var lastValue = data.currentWord;
			currentWord = lastValue;



			refreshDisplay();

		});
}