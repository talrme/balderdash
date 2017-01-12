//This page adds any entry to both databases

var allWords = new Firebase('https://amber-inferno-1192.firebaseio.com/balderDash/words');
var someWords = new Firebase('https://amber-inferno-1192.firebaseio.com/balderDash/words2');


$( document ).ready(function() {
	

	$( "#submit" ).click(function() {
	  var word = $("#word").val();
	  var def = $("#definition").val();
	  var example = $("#example").val();
	  
	  addWord(word,def,example);

	  alert('"'+word+'"' + ' added to database');
	  clearForm();
	});


	$( "#clear" ).click(clearForm);
	
	

});

function clearForm(){
	$('#word').val('');
	$('#definition').val('');
	$('#example').val('');
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


	var newWord = someWords.push();
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

