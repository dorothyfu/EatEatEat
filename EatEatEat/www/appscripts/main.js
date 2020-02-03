
console.log("yo, I'm alive!");

var paper = new Raphael(document.getElementById("mySVGCanvas"));
var toggleButton = document.getElementById("toggleButton");
var scoreBoard = document.getElementById("scoreBoard");

// Paper dimensions
var dimX = paper.width;
var dimY = paper.height;


// Game variables
var totalScore = 0;
var highScore = 0;

var gameStarted = false;

var playerState = 'unclicked';
let playerScore = 5;


// Sounds
let backgroundSnd = new Audio ("resources/background1.mp3");
backgroundSnd.loop = true;
let hitSquareSnd = new Audio("resources/hitSquare.wav");
let pickupSnd = new Audio("resources/pickup.wav");
let endSnd = new Audio("resources/end.wav");
let powerupSnd = new Audio("resources/end.wav");


//--------------------HELPER FUNCTIONS-----------------//

let randIntMax = function(max) {
	return Math.floor(max*Math.random());
}


//---------------BACKGROUND----------------//

var bg = paper.rect(0, 0, dimX, dimY);

bg.attr({
        "fill" : "#F9DC5C"        // must be filled to get mouse clicks        
})


//---------------------PLAYER------------------------//

let player = paper.circle(dimX/2, dimY/4 * 3, 10);

player.attr({
	"fill": "#F4AFAB",
	"stroke": "grey",
	"stroke-width": 1,
	"size": 15
})

player.node.addEventListener('mousedown', function(ev){
	console.log("Dot was clicked!");
	playerState = 'clicked';
})

player.node.addEventListener('mouseup', function(ev){
	console.log("Dot was unclicked!");
	playerState = 'unclicked';
})

bg.node.addEventListener('mousemove', function(ev){
	console.log("Mousemove");

	if (gameStarted === true && playerState === 'clicked') {
		player.animate({cx: ev.offsetX}, 0.001);
		playerText.animate({x: ev.offsetX}, 0.001);
	}
	
})


//--------------------CIRCLES------------------------//

let numCirc = 5;
var circles = [];
var cText = [];
var highestCircle = dimY;
var highestCircleIndex;

// Create the circles
let createCircles = function() {
	var i = 0;

	while(i < numCirc) {
		let x = randIntMax(dimX);
		let y;

		if (gameStarted == true) {
			y = randIntMax(dimY) - dimY;
		} else {
			y = randIntMax(dimY - dimY/4);
		}

		if (y < highestCircle) {
			highestCircle = y;
			highestCircleIndex = i;
		}

		circles[i] = paper.circle(x, y, 10);
		circles[i].attr({
			"fill": "grey",
			"stroke": "grey",
			"stroke-width": 1,
			"size": 15
		})

		circles[i].value = randIntMax(5) + 1;
		circles[i].ypos = y;
		circles[i].xpos = x;

		cText[i] = paper.text(x, y - 20, `${circles[i].value}`);
		cText[i].ypos = y - 20;

		i++;
	}
}

createCircles();

// Move the circles down the screen
let updateCircles = function() {
	var j = 0;

	while (j < numCirc) {

		circles[j].ypos += yrate;

		circles[j].attr({
			'cy': circles[j].ypos
		})

		cText[j].ypos += yrate;

		cText[j].attr({
			'y': cText[j].ypos
		})

		j++;
	}

	if (circles[highestCircleIndex].ypos - 25 > dimY) {
		clearInterval(circInterval);
		circles = [];
		cText = [];

		createCircles();
		circInterval = setInterval(updateCircles, 50);
	}
}

// Check when the player overlaps the circle to collect it
let detectCircOverlap = function() {
	let playerTop = player.attr("cy") - 10;
	let playerBottom = player.attr("cy") + 10;
	let playerLeft = player.attr("cx") - 10;
	let playerRight = player.attr("cx") + 10;

	let i = 0;

	while (i < numCirc) {
		if (playerTop <= circles[i].ypos + 10 && playerBottom >=circles[i].ypos - 10 && playerLeft <= circles[i].xpos + 10 && playerRight >= circles[i].xpos - 10) {
			pickupSnd.play();
			playerScore += circles[i].value;
			playerText.attr({
					"text": playerScore
				})

			circles[i].remove();
			cText[i].remove()
			circles[i].value = 0;
			i = numCirc;
		}

		i++;
	}
}


//------------------SQUARES------------------------//

let numSq = 6;
let maxSquareScore = 50;
let sqWidth = dimX/numSq;
let sqHeight = sqWidth;
let yrate = 4;

let easyMax = 10;
let mediumMax = 25;
let hardMax = 50;
var level = 1;

var squares = [];
var text = [];

var hitSquareInterval;

var selectedSqIndex;
var index;

var powerUpEnabled = false;
var powerUpTime;

// Check when the player touches a square
let checkOverlap = function() {
	index = currSq(player.attr("cx"), sqWidth);
	let currTime = Date.now();

	// If it's times up for powerup mode, return the game to normal
	if (powerUpEnabled && currTime - powerUpTime >= 5000) {
				powerUpEnabled = false;
				yrate = 4;
				clearInterval(sqInterval);
				sqInterval = setInterval(updateSquares, 50);
	}

	if (isOverlapping()) {
		hitSquareSnd.play();

		// If player is in powerup mode, just destroy the square and don't decrement
		if (powerUpEnabled && currTime - powerUpTime <= 5000){
			totalScore += squares[index].value;
			squares[index].value = 0;

			text[index].attr({
				"text": squares[index].value
			})

		} else {
			// If player is not in powerup mode, decrement the square score
			playerScore--;
			playerText.attr({
				"text": playerScore
			}) 

			squares[index].value--;
			text[index].attr({
				"text": squares[index].value
			})

			totalScore++;
		}
		
				
		// If the square is destroyed
		if (squares[index].value < 1) {

			if (squares[index].isPowerup) {
				// If the square is a powerup square, enter powerup mode
				powerupSnd.play();
				powerUpEnabled = true;
				powerUpTime = Date.now();
				yrate = 20;

				clearInterval(sqInterval);
				sqInterval = setInterval(updateSquares, 50);
				clearInterval(circInterval);
				circInterval = setInterval(updateCircles, 50);
			} else {
				// Otherwise, just continue moving the squares
				clearInterval(hitSquareInterval);
				clearInterval(sqInterval);
				sqInterval = setInterval(updateSquares, 50);
				clearInterval(circInterval);
				circInterval = setInterval(updateCircles, 50);
			}

			squares[index].remove();
			text[index].remove();
			
		} 

		// If the player is out of points, end the game
		if (playerScore < 1 && gameStarted == true) {
			clearInterval(hitSquareInterval);
			clearInterval(circInterval);
			clearInterval(circOverlapInterval);
			endGame();
		}
	}
}

// Determines which column the player is currently in
let currSq = function(px, sqWidth) {
	return Math.floor(px/sqWidth);
}

// Determines if the player is overlapping a square
let isOverlapping = function() {
	let playerEdge = player.attr("cy") - 10;
	if (playerEdge <= squares[index].ypos + sqHeight && playerEdge >= squares[index].ypos) {
		clearInterval(sqInterval);
		clearInterval(circInterval);
		return true;
	} else {
		return false;
	}
}

// Move the squares down the screen
let updateSquares = function() {
	var j = 0;

	while (j < numSq) {

		squares[j].ypos += yrate;

		squares[j].attr({
			'y': squares[j].ypos
		})

		text[j].ypos += yrate;

		text[j].attr({
			'y': text[j].ypos
		})

		j++;
	}

	// When the row of squares are off the screen, create a new row at the top
	if (squares[0].ypos > dimY) {
		clearInterval(sqInterval);
		squares = [];
		text = [];

		createSquares();

		if (powerUpEnabled) {
			sqInterval = setInterval(updateSquares, 25);
			hitSquareInterval = setInterval(checkOverlap, 150);
		} else {
			sqInterval = setInterval(updateSquares, 50);
			hitSquareInterval = setInterval(checkOverlap, 150);
		}
	}
}

// Create the row of squares
let createSquares = function() {
	let i = 0;

	while(i < numSq) {
		let n = 1;
		if (level < 5) {
			n += randIntMax(easyMax);
		} else if (level < 10) {
			n += randIntMax(mediumMax);
		} else {
			n += randIntMax(hardMax);
		}

		squares[i] = paper.rect(sqWidth * i, -sqHeight, sqWidth, sqHeight, 10);
		squares[i].attr({
			"fill": "#F4CBC6",
			"stroke": "grey",
			"stroke-width": 1
		})

		squares[i].ypos = -sqHeight;
		squares[i].value = n;

		text[i] = paper.text(sqWidth * i + sqWidth/2, -sqHeight + sqHeight/2, `${squares[i].value}`);
		text[i].ypos = -sqHeight + sqHeight/2;

		if (n == 25) {
			squares[i].isPowerup = true;
			squares[i].attr({
				"fill": "#D5C6F4",
				"stroke": "white",
				"stroke-width": 1
			})
		} else {
			squares[i].isPowerup = false;
		}

		i++;
	}
	level++;
}

// Create square here instead of start function so the score text stays above the squares
createSquares();

// Player text is placed here so the number appears above the squares
let playerText = paper.text(dimX/2, dimY/4 * 3 - 20, playerScore);


//--------------------START BUTTON--------------------//

var startButton = paper.rect(150, 215, 100, 70);
var startText = paper.text(dimX/2, dimY/2, 'START');
var sqInterval;
var newInterval;
var circOverlapInterval;

startButton.attr({
	"fill": "#F4695D",
	"stroke": "grey",
	"stroke-width": 1
})

startText.attr({
	"fill": "grey"
})

let start = function(ev) {
	console.log("Starting game");

	backgroundSnd.play();

	hideStartButton();

	//Make game start moving
	hitSquareInterval = setInterval(checkOverlap, 150);
	sqInterval = setInterval(updateSquares, 50);
	circInterval = setInterval(updateCircles, 50);
	circOverlapInterval = setInterval(detectCircOverlap, 30);
}

startButton.node.addEventListener('click', function(ev){
	gameStarted = true;
	hideStartButton();

	start();
})

// hide/show start button

let hideStartButton = function(){
	startButton.hide();
	startText.hide();
}

let showStartButton = function(){
	startButton.show();
	startText.show();
}

//----------------END GAME----------------------//


let endGame = function() {
	console.log("Game has ended.");

	endSnd.play();
	backgroundSnd.pause();

	clearInterval(sqInterval);
	clearInterval(hitSquareInterval);

	// Update high score if it was beat and send score to the chat
	if (totalScore > highScore) {
		highScore = totalScore;
		scoreBoard.innerHTML = "High Score: " + highScore;
	}
	
	// Reset all variables
	gameStarted = false;
	playerState = "unclicked";
	playerScore = 5;

	// Reset player to starting position
	player.attr({
		"cx": dimX/2,
		"cy": dimY/4 * 3
	})

	playerText.attr({
		"text": playerScore,
		"x": dimX/2, 
		"y": dimY/4 * 3 - 20
	})

	// Remove all leftover squares
	let j = 0;
	while (j < numSq) {
		if (text[j]) {
			text[j].remove();
		} 

		if (squares[j] != undefined) {
			squares[j].remove();
		}

		j++;
	}

	showStartButton();
	createSquares();

	alert("Game Over! Your score is " + totalScore);

	totalScore = 0;
}
