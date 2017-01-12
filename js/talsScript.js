var listOfWords;
var orderOfWords;
var currentWord = 0;
var totalWords;
var pageToDisplay = 1;
var myName = "";


var allWords = new Firebase('https://amber-inferno-1192.firebaseio.com/balderDash/words2'); // change this to words1 to include all of Andy's words
var globalVariables = new Firebase('https://amber-inferno-1192.firebaseio.com/balderDash/variables');
var allEntries = new Firebase('https://amber-inferno-1192.firebaseio.com/balderDash/entries');

$( document ).ready(function() {
	
	//Load word list and determine first word to display (randomly)
	loadWords();
	changePage();	

	
	//Activate next and previous buttons
	$("#next").click(next);
	$("#previous").click(previous);

	$("#definition").hide();
	$("#example").hide();
	
	//Checks if anyone else changes the value of "currentWord so that everyone sees the same thing"
	checkForChanges();
	checkForPageChanges();
	
	setClicks();

	//Go to first page if no one has been to website in over 30 minutes
	resetToFirstPage();
	
	setUpNameBox();
	getUniqueID();

	removeOldPeople()

	refreshChecklist()


});




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
  	// Get all words and definitions

	
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


// Remove all people that haven't been active in more than 30 minutes
function removeOldPeople(){
	var ref = globalVariables.child('people');
	var dataArray = [];
	ref.once('value', function(data) {
  	var d = new Date();
	var currentTime = d.getTime();	
  	
  		data.forEach(function(childSnapshot) {
  			
  			var key = childSnapshot.key(); //Gets the key of each child
  			//console.log("key:");
  			//console.log(key);
			var person = childSnapshot.val();
			//console.log(person);
			var personAge = (currentTime-person.timeStamp)/1000/60;  // Time ago the point was entered (in minutes)
			//console.log("person Age:")
			//console.log(personAge);

			if (personAge>30){
				
				ref.child(key).remove();
				console.log("person deleted!");
			}
			else {
				
			}
			
			//dataArray.push(childSnapshot.val()) //Utilize this if you want to do another loop on all the data
		});
		//console.log(dataArray);

		
		/*
		$.each(dataArray,function(index,person){
			//console.log(point);
			var personAge = (currentTime-person.timeStamp)/1000/60;  // Time ago the point was entered (in minutes)
			console.log("person Age:")
			console.log(personAge);

			if (personAge>30){
				var childName = person.name;
				ref.child(childName).remove();
				console.log("delete!");
			}
			
		}); // end Each*/

	});
	


	
} // end removeOldPoints



//Update the network's value of "current word"
function updateCurrentWord(){
	var currentWordData = globalVariables.child('currentWord');
	currentWordData.update({
	    currentWord: currentWord,
	    timeStamp: Firebase.ServerValue.TIMESTAMP
	});
}


// Checks for changes to the currentWord - This is happenning constantly
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
/*
 Page ID Key:
	1: Word Selection
	2:
*/

// All the buttons are given their actions here. 

function setClicks(){
	$("#newWord").click(function() {
		next();
		pageToDisplay=1;
		updatePageToDisplay();
		changePage();
		
		//clear entries:
		clearAllCheckBoxes(); // Clears the checkboxes on the server
		clearAllEntries();           //Clears on network
		$("#myDefinition").val("");  //Clears in browser
		$("#myExample").val("");



		
	});
	$("#selectWord").click(function() {
		pageToDisplay=2;
		updatePageToDisplay();
		changePage();
	});
	$("#submitDefinition").click(function() {
		var myDef = $("#myDefinition").val();
		var myEx = $("#myExample").val();


		addEntry(myDef, myEx);

		//Update status on network to completed definition:
		var uniqueID = $.cookie('uniqueID')
		 	var thisPerson = new Firebase(uniqueID);
		 	thisPerson.update({
			    timeStamp: Firebase.ServerValue.TIMESTAMP,
			    active: true,
			    completed:true
			});

		
		pageToDisplay=3;
		//updatePageToDisplay();
		changePage();
		addCurrentWordToEntries();
		
		//If the last to complete, go to the have everyone go to the next page
		if(checkIfLastToComplete()){
			$("#allDoneDef").click();
		}

	});

	// If someone decides to go back to first page
	$("#goBackSelect").click(function() {
		
		pageToDisplay=1;
		updatePageToDisplay();
		changePage();
		
		//clear entries:
		clearAllCheckBoxes(); // Clears the checkboxes on the server
		clearAllEntries();    //Clears on network
	});
	
	$("#allDoneDef").click(function() {
		
		pageToDisplay=4;
		updatePageToDisplay();
		changePage();
		clearAllCheckBoxes(); // Clears the checkboxes on the server
	});

	$("#goBackDefs").click(function() {
		
		$("#selectWord").click();
		clearAllEntries();        //Clears the entries on the server
		clearAllCheckBoxes();
	});

	$("#castVote").click(function() {
		castMyVote();
		pageToDisplay=5;
		//updatePageToDisplay();
		changePage();

		var uniqueID = $.cookie('uniqueID')
		 	var thisPerson = new Firebase(uniqueID);
		 	thisPerson.update({
			    timeStamp: Firebase.ServerValue.TIMESTAMP,
			    active: true,
			    completed:true
			});

		 //If the last to complete, go to the have everyone go to the next page
		if(checkIfLastToComplete()){
			$("#allDoneVotes").click();
		}


	});
	$("#allDoneVotes").click(function() {
		pageToDisplay=6;
		updatePageToDisplay();
		changePage();
		

		//clear inactive people:
		clearInactivePeople();
		clearAllCheckBoxes();
	});
	

}

//hides and displays all the correct divs


/* "Goes" to the correct page - really just shows and hides the appropriate DIVS
1.First page
2. Writing definitions
3. Waiting for others to type definitions
4. Voting 
5. Waiting for others to vote
6. Display results
*/ 

function changePage(){
	switch(pageToDisplay) {
	    case 1:
	    	//console.log("page changed to 1");
	        $("#word").show();
	        $("#selectingWord").show();
	        $("#makingUpDefs").hide();
	        $("#waitingForOthersDefs").hide();
	        $("#castingVotes").hide();
	        $("#waitingForOthersVotes").hide();
	        $("#completedChecklist").hide();
	        $("#finalResults").hide();

	        //Clear entry fields
	        $("#myDefinition").val("");  //Clears in browser
			$("#myExample").val("");


	        break;
	    case 2:
	    	//console.log("page changed to:");
	    	//console.log(pageToDisplay);
	    	$("#word").show();
	        $("#selectingWord").hide();
	        $("#makingUpDefs").show();
	        $("#waitingForOthersDefs").hide();
	        $("#castingVotes").hide();
	        $("#waitingForOthersVotes").hide();
	        $("#completedChecklist").hide();
	        $("#finalResults").hide();
	        break;
	    case 3:
	    	//console.log("page changed to:");
	    	//console.log(pageToDisplay);
	    	$("#word").hide();
	        $("#selectingWord").hide();
	        $("#makingUpDefs").hide();
	        $("#waitingForOthersDefs").show();
	        $("#castingVotes").hide();
	        $("#waitingForOthersVotes").hide();
	        $("#completedChecklist").show();
	        $("#finalResults").hide();
	        break;
	    case 4:
	    	//console.log("page changed to:");
	    	//console.log(pageToDisplay);
	    	
	    	//Do this when page loads
	    	loadAllEntries();

	    	$("#word").show();
	        $("#selectingWord").hide();
	        $("#makingUpDefs").hide();
	        $("#waitingForOthersDefs").hide();
	        $("#castingVotes").show();
	        $("#waitingForOthersVotes").hide();
	        $("#completedChecklist").hide();
	        $("#finalResults").hide();
	        break;
	    case 5:
	    	console.log("page changed to:");
	    	console.log(pageToDisplay);
	    	$("#word").hide();
	        $("#selectingWord").hide();
	        $("#makingUpDefs").hide();
	        $("#waitingForOthersDefs").hide();
	        $("#castingVotes").hide();
	        $("#waitingForOthersVotes").show();
	        $("#completedChecklist").show();
	        $("#finalResults").hide();
	        break;
	    case 6:
	    	console.log("page changed to:");
	    	console.log(pageToDisplay);
	    	
	    	displayResults();

	    	$("#word").show();
	        $("#selectingWord").hide();
	        $("#makingUpDefs").hide();
	        $("#waitingForOthersDefs").hide();
	        $("#castingVotes").hide();
	        $("#waitingForOthersVotes").hide();
	        $("#completedChecklist").hide();
	        $("#finalResults").show();
	        break;

	    case 99:
	    	console.log("page changed to:");
	    	console.log(pageToDisplay);
	        $("#word").show();
	        $("#selectingWord").show();
	        $("#makingUpDefs").show();
	        $("#waitingForOthersDefs").show();
	        $("#castingVotes").show();
	        $("#waitingForOthersVotes").show();
	        $("#completedChecklist").show();
	        $("#finalResults").show();
	        break;
	    default:
	        console.log("sorry, page change didn't happen since that page doesn't exist");
	}
}


// Updates on the network which page to display
function updatePageToDisplay(){
	//var pageToDisplayRef = globalVariables.child('currentWord');
	
	globalVariables.update({pageToDisplay:pageToDisplay});
}

// Constantly checks if the page on the network is the same locally, if not, it changes the local one
function checkForPageChanges(){
	var currentPageToDisplay = globalVariables.child('pageToDisplay');

	currentPageToDisplay.on('value',function(snapshot){
			// Get the object of the variable current word data.currentWord and data.timeStamp
			var data = snapshot.val();

			if (pageToDisplay != data){
				pageToDisplay = data;
				changePage();
			}			

		});
}

//if nobody has been on the website in over 30 minutes, go to page 1
function resetToFirstPage(){

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

		// If the first word hasn't been changed in 30 minutes, start on Page 1
		if (timeDiff>18000000){
			next();
			pageToDisplay=1;
			updatePageToDisplay(); //Updates on network
			changePage(); // Change page based on network
			clearAllEntries();
			console.log("no one has been on the website in over 30 minutes, reset to page 1");
			
		} else{
			console.log("someone has been on the website lately. Set to server page");

		}

		});

		
}


function addCurrentWordToEntries(){
	allEntries.once("value", function(snapshot){
		var currentWordExists = snapshot.child("currentWord").exists();
		console.log(currentWordExists);

		if (!currentWordExists){
			var currentWordData = allEntries.child('currentWord');
			var path = currentWordData.toString();
			var orderIndex = Math.floor((Math.random() * 1000) + 1);

			var def = listOfWords[currentWord].def;
			var ex = listOfWords[currentWord].example;

			currentWordData.update({
			    def: def,
			    example: ex,
			    path: path,
			    votes:0,
			    orderIndex: orderIndex,
			    correctAnswer: true
			});
		}

		
	});
	
}

function addEntry(def,ex){
	var newEntry = allEntries.push();
	var path = newEntry.toString();
	var orderIndex = Math.floor((Math.random() * 1000) + 1);
	var author = $.cookie('myName');

	newEntry.update({
	    def: def,
	    example: ex,
	    path: path,
	    votes:0,
	    orderIndex: orderIndex,
	    correctAnswer: false,
	    author: author
	});
}

function checkIfLastToComplete(){
	
	var lastToComplete = true;

	var people = globalVariables.child('people')
	people.once('value', function(data) {

	  
	  

	  data.forEach(function(childSnapshot) {
			var person = childSnapshot.val();
			var completed = person.completed;
			var active = person.active;


			if ((!completed) && (active)){
				lastToComplete = false;
			}
			
			
		}); // end forEach

	  
		
		
	}); // end 
	if(lastToComplete){
	  		return true;
	  } else{
	  		return false;
	  }

}


function clearAllEntries(){
	allEntries.remove();
}

function clearAllCheckBoxes(){
	var people = globalVariables.child('people');
	people.once('value', function(data) {
  		data.forEach(function(childSnapshot) {
  			
  			var key = childSnapshot.key(); //Gets the key of each child
  			
  			people.child(key).update({
  				completed:false
			});
			
			
			
		});
		

	});
}

function loadAllEntries(){

	allEntries.orderByChild("orderIndex").once("value", function(data) {
	  var output = "";
	  var option = 1;

	  data.forEach(function(childSnapshot) {
			var tempEntry = childSnapshot.val();
			var def = tempEntry.def;
			var ex = tempEntry.example;
			var path = tempEntry.path;

			//skip the word if there is no definition
			
			if ((!def=="")){
				output += '<div class = "entry"><div class="radio">' +
	                    '<label for="radios-'+option+'">' +
	                      '<input type="radio" name="entries" id="radios-'+option+'" value='+path+'>' +
	                     'Option '+ option +
	                    '</label>' +
	                    '<p></p>' +
	                    '<p>'+def+'</p>' +     
	                    '<p ><em>'+ex+'</em></p>' +
	                    '<hr class="dotted">' +
	                	'</div></div>';
	            option += 1;
			}

			
			
		}); // end forEach
		
		$("#dispalyingEntries").html(output);
	}); // end orderByChild
	//});

}//end loadAllEntries


//This function adds 1 to the vote counts on the server
function castMyVote(){
	// Get the path of the option voted for
	var valOfChecked = $('input[name=entries]:checked', '#entriesForm').val();
	var checkedOptionRef = new Firebase(valOfChecked+'/votes');

	//Updates the value on the server. This function allows multiple voters to apply their votes at the same time
	//Votes are counted in a negative way in order to order them as winners later
	checkedOptionRef.transaction(function(currentVotes) {
	  return currentVotes-1;
	});

}



function refreshChecklist(){
	var people = globalVariables.child('people')
	people.on('value', function(data) {

	  var output = "";
	  

	  data.forEach(function(childSnapshot) {
			var person = childSnapshot.val();
			var name = person.name;
			var image ="";

			if (person.completed) {
				image = '<img src="images/yes2.png" height="20">';
			} else {
				image = '<img src="images/no.png" height="18">';
			}


			if (person.active){
				output += '<li>'+image+'&nbsp; '+name+'' +
	                    '</li>';
           	}
			
		}); // end forEach
		
		$("#checklist").html(output);
	}); // end orderByChild
}


//If someone didn't vote, they become "inactive"
function clearInactivePeople(){
	var people = globalVariables.child('people')
	people.once('value', function(data) {

	  data.forEach(function(childSnapshot) {
			var person = childSnapshot.val();
			var completed = person.completed;
			
			var key = childSnapshot.key(); //Gets the key of each child
  			


  			

			if ((!completed)){
				people.child(key).update({
	  				active:false
				});
			}
			
			
		}); // end forEach

	  
		
		
	}); // end 
}

function displayResults(){
	allEntries.orderByChild("votes").on("value", function(data) {
	  var output = "";
	  var winnerVoteCounts = 0;

	  data.forEach(function(childSnapshot) {
			var tempEntry = childSnapshot.val();
			var def = tempEntry.def;
			var ex = tempEntry.example;
			var votes = tempEntry.votes*(-1);
			var correct = tempEntry.correctAnswer;
			var author = tempEntry.author;
			if (author == null){
			    author = "Computer Robot";
			}
			
			//skip if there is no definition
			if(!(def=="")){

				//Add "winner" image if winner
				if (votes >= winnerVoteCounts){
					winnerVoteCounts = votes;
					output +=   '<div id="wrapper" style="text-align: center">'+
				                '<img id="waitingIcon" src="images/winner.png" height="50"><b>WINNER! &nbsp;</b><img id="waitingIcon" src="images/winner.png" height="50">'+
				                '<br><br>'+
				           		'</div>';
				}

				//Add "correct" images if correct answer (original answer)
				if (correct) {
					

					output +=   '<div id="wrapper" style="text-align: center">'+
				                '<img id="waitingIcon" src="images/correctAnswer2.png" height="35"><b>Correct Answer &nbsp;</b><img id="waitingIcon" src="images/correctAnswer2.png" height="35">'+
				               ' <br><br>'+
				            '</div>';

				}

				//voteOrVotes - if only 1 vote, don't write votes:) 
		  		var voteOrVotes = "votes";
		  		if (votes==1){
		  			voteOrVotes = "vote";
		  		}


				output +=    '<p><b>'+author+': ('+votes+' '+voteOrVotes+')</b><p>'+
				            '<p>'+def+'</p>'  +             
				            '<p ><em>'+ex+'</em></p>'+

				            '<hr class="dotted">';


			}


			/*
			output += '<div class = "entry"><div class="radio">' +
                    '<label for="radios-'+option+'">' +
                      '<input type="radio" name="entries" id="radios-'+option+'" value='+path+'>' +
                     'Option '+ option +
                    '</label>' +
                    '<p></p>' +
                    '<p>'+def+'</p>' +     
                    '<p ><em>'+ex+'</em></p>' +
                    '<hr>' +
                	'</div></div>';
            option += 1;
            */
			
		}); // end forEach
		
		$("#dispalyingVoteResults").html(output);
	}); // end orderByChild
}

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



function setUpNameBox(){
		$("#saveIcon").hide()
		$("#myName").click(divClicked);
		
		//If there is a name in cookies, display it in #myName
		if (typeof $.cookie('myName') === 'undefined'){
		 	//select a random name
		 	var randomNames = ['Dim','Bird','Dot','Flik','Francis','Heimlich','Hopper','Manny','Molt','Rosie','Slim','Caterpillar','Alice','Bill','Doorknob','Tweedle Dee','Rabbit','Coco','Lucky','Wally','Spot','Dipstick','Duffy','Patch'];
		 	var randomName = randomNames[Math.floor(Math.random()*randomNames.length)];
		 	$.cookie('myName', randomName); 
		 	$("#tempName").html($.cookie('myName'));

		} else {
		 $("#myName").html($.cookie('myName'));
		}
}

// If the div gets clicked, it turns into a text box
function divClicked() {
    $("#saveIcon").show()
    var divHtml = $(this).html();
    divHtml = ""; //comment this row out if you want the text to stay
    $( "#temp" ).hide();
    var editableText = $("<textarea />");
    editableText.val(divHtml);
    editableText.attr('placeholder','Enter name here')
    editableText.attr('rows','1')
    $(this).replaceWith(editableText);
    editableText.focus();
    // setup the blur event for this new textarea
    editableText.blur(editableTextBlurred); //When clicking off of the box, it turns to text
}

// Once you click off of it, the name gets saved
function editableTextBlurred() {
    $("#saveIcon").hide()

    var html = $(this).val();

    if(html==""){
    	html="Enter Name Here"
    }

    var viewableText = $("<span>");
    viewableText.html(html);
    //viewableText.attr('id','myName')
    $(this).replaceWith(viewableText);
    $.cookie('myName', html);    
    updateMyNameOnServer()

    $( "#temp" ).show();
    // setup the click event for this new div
    viewableText.click(divClicked);
}

function getUniqueID(){
	//If there is no uniqueID, set one on the server and save in cookies
	if (typeof $.cookie('uniqueID') === 'undefined'){
		 	var person = globalVariables.child('people');
			var uniqueIDref = person.push({
			    name: $.cookie('myName'),
			    timeStamp: Firebase.ServerValue.TIMESTAMP,
			    active: true
			});
			var uniqueID = uniqueIDref.toString()
			$.cookie('uniqueID',uniqueID);


		} else {
		 	var uniqueID = $.cookie('uniqueID')
		 	var thisPerson = new Firebase(uniqueID);
		 	thisPerson.update({
			    timeStamp: Firebase.ServerValue.TIMESTAMP,
			    active: true
			});

	}
}

function updateMyNameOnServer(){
	var uniqueID = $.cookie('uniqueID');
 	var thisPerson = new Firebase(uniqueID);
 	var myName = $.cookie('myName');
 	thisPerson.update({
	    name: myName,
	   timeStamp: Firebase.ServerValue.TIMESTAMP
	});
}

function clearAllOldNames(){
	//Clear all old names
	console.log("");
}
