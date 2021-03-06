// Basic game setup to display in HTML

var game_width = 720;
var game_height = 500;
var game_scale = 1;

var objectsStart = 1;

var gameport = document.getElementById("gameport");
var renderer = new PIXI.autoDetectRenderer(game_width, game_height);
gameport.appendChild(renderer.view);


var stage = new PIXI.Container();
stage.scale.x = game_scale;
stage.scale.y = game_scale;

var game_view = new PIXI.Container();
stage.addChild(game_view);

var title_view = new PIXI.Container();
stage.addChild(title_view);

var scroller = new Scroller(game_view);

var tutorial = new PIXI.Container();
game_view.addChild(tutorial);

var platforms = new PIXI.Container();
game_view.addChild(platforms);

var obstacles = new PIXI.Container();
game_view.addChild(obstacles);

var death_view = new PIXI.Container();
stage.addChild(death_view);

death_view.visible = false;
death_view.interactive = false;

game_view.visible = true;
game_view.interactive = false;

title_view.visible = true;
title_view.interactive = true;

title_view.alpha = 70;


var player = {};
player.jumping = false;

var laserTextureArrays = [];

var first_run = true;

var first_platforms = [];

var speed = 3; // The overall scaling of the game speed

var game_on = false;

var fall_speed = 5;

var p_collission = false; // collision for platforms

var score = 0;

var platform_texture;

var score_text;

var distance_from_last = -200;
var platform_distance = 200;

var last_y = 475;

var platform_1 = {};
var platform_2 = {};

var select_sound;
var fall_death_sound;
var laser_death_sound;
var game_theme;
var jump_sound;


var runningFrames = [];
//player.runner;
var first_positioning = true;

var dead = false;


var num_signs = 0;


PIXI.loader
	.add('./menu_assets/menu_assets.json')
	.load(loadMenus);


PIXI.loader
	.add("select.wav")
	.add("fall_death.wav")
	.add("laser_death.wav")
	.add("laser_off.wav")
	.add("jump.wav")
	.add("proj_4_theme.wav")
	.load(soundFnc);

function soundFnc(){// loads the sounds, sets the theme to loop
	
	select_sound = PIXI.audioManager.getAudio("select.wav");
	fall_death_sound = PIXI.audioManager.getAudio("fall_death.wav");
	laser_death_sound = PIXI.audioManager.getAudio("laser_death.wav");
	laser_off_sound = PIXI.audioManager.getAudio("laser_off.wav");
	game_theme = PIXI.audioManager.getAudio("proj_4_theme.wav");
	jump_sound = PIXI.audioManager.getAudio("jump.wav");
	
	game_theme.loop = true;
	game_theme.play();
	
	
}

function loadMenus(){

	var title_screen = new PIXI.Sprite(PIXI.Texture.fromFrame('title_screen.png'));
	title_view.addChild(title_screen);
	title_screen.interactive = true;
	title_screen.on('mousedown', function(){select_sound.play();});
	title_screen.on('mousedown', changeView.bind(null, game_view));
	title_screen.on('mousedown', function(){game_on = true;});
	title_screen.on('mousedown', firstRun);



	var death_bg = new PIXI.Sprite(PIXI.Texture.fromFrame('death.png'));
	death_view.addChild(death_bg);
	

	var you_died = new PIXI.Sprite(PIXI.Texture.fromFrame('you_died.png'));
	death_view.addChild(you_died);
	you_died.position.x = 120;
	you_died.position.y = 90;
	you_died.scale.x = 1.1;
	you_died.scale.y = 1.1;


	var play_again = new PIXI.Sprite(PIXI.Texture.fromFrame('play_again.png'));
	death_view.addChild(play_again);
	play_again.position.x = game_width/2;
	play_again.position.y = 250;
	play_again.interactive = true;
	play_again.on('mousedown', function(){select_sound.play();});
	play_again.on('mousedown', reset);


	var credits = new PIXI.Sprite(PIXI.Texture.fromFrame('credits.png'));
	//death_view.addChild(credits);
	credits.position.x = 420;
	credits.position.y = 380;

}




PIXI.loader
	.add('./scroller_assets/platform_assets/platform_assets.json')
	.add('./obstacle_assets/laser.json')
	.add('./obstacle_assets/laser2.json')
	.add('./obstacle_assets/laser3.json')
	.add("running.json") // runing player
	.load(loadGame);


function loadGame(){



	runningFrames = [];
	for(i=1; i<=4; i++) {
		runningFrames.push(PIXI.Texture.fromFrame('running' + i + '.png'));
	}
	player = new PIXI.extras.MovieClip(runningFrames);
	game_view.addChild(player);
	player.animationSpeed = 0.25;
	player.anchor.x = .5;
	player.anchor.y = 1;
	player.position.x = 120;
	player.position.y = 430;
	player.play();


	
	// laserz 1
	var laserTexture1 = [];
	for(var a=1; a<=11; a++) {
		laserTexture1.push(PIXI.Texture.fromFrame('laser_trap_air_'+a+'.png'));
	}
	// laserz 2
	var laserTexture2 = [];
	for(var a=2; a<=12; a++) {
		laserTexture2.push(PIXI.Texture.fromFrame('blaser'+a+'.png'));
	}
	// laserz 3
	var laserTexture3 = [];
	for(var a=3; a<=11; a++) {
		laserTexture3.push(PIXI.Texture.fromFrame('glaser'+a+'.png'));
	}
	laserTextureArray = [laserTexture1,laserTexture2,laserTexture3];




	platform_texture = PIXI.Texture.fromFrame('mid_0.png');
	

	for(var k = 0; k <= game_width + 240; k += 120){

		var platformk = new PIXI.Sprite(platform_texture);
		platforms.addChild(platformk);
		platformk.visible = true;
		platformk.anchor.x = .5;
		platformk.anchor.y = 1.0;
		platformk.position.x = k;
		platformk.position.y = 625;

		first_platforms.push(platformk);

	}
 displayScore();
}



// Add any keyboard functions we need to this array
// These are they only keys that we will steal control from
var to_overwrite = [32];

window.addEventListener('keydown', function(e){

	if(to_overwrite.indexOf(e.keyCode) === -1) return true; // if the input key isn't in the array, we don't want it

	else {

		e.preventDefault();
		if(e.repeat || !player || player.jumping)  return;

		else if (e.keyCode == 32)
			
			// check if player is on one of the platforms
			
			if(!player.jumping && p_collission){
				if(platform_1.on && player.x > (platform_1.segments[0].x-120) && player.x < platform_1.segments[platform_1.segments.length-1].x){// check if player is in x bounds of platform_1
					if(player.y >= platform_1.height + 40 && player.y <= (platform_1.height + 70)){// check y bounds
						jump();
					}
				}
				else if(platform_2.on && player.x > (platform_2.segments[0].x-120) && player.x < platform_2.segments[platform_2.segments.length-1].x){// check if player is in x bounds of platform_2
					if(player.y >= platform_2.height + 40 && player.y <= (platform_2.height + 70)){// check y bounds
						jump();
					}
				}
			}// end platform_1 / platform_2 check

			
			// check if player is on the beginning segment
			if(!p_collission && player.y >= 420) jump();
	}

});


 

function displayScore(){
	// string "score: "
	score_text = new PIXI.Text('Score: 0',{font: '24px Arial', fill: 0xffffff, align : 'center'});

	game_view.addChild(score_text);
	score_text.visible = false;
	score_text.anchor.x = .5;
	score_text.x = game_width/2;
	
	// string timer
	
	
	
}

function updateTimer(){
	if(game_on){
	score_text.text = 'Score: ' + Math.floor(score);
	score_text.visible = true;
	}
}


var intervel = setInterval(updateTimer, 1000);


function reset(){
	intervel = setInterval(updateTimer, 1000);

	for(var i = 0; i < stage.children.length; i++){
		stage.removeChildAt(i);
	}

	game_view = new PIXI.Container();
	stage.addChild(game_view);

	title_view = new PIXI.Container();
	stage.addChild(title_view);

	scroller = new Scroller(game_view);

	tutorial = new PIXI.Container();
	game_view.addChild(tutorial);

	platforms = new PIXI.Container();
	game_view.addChild(platforms);


	obstacles = new PIXI.Container();
	game_view.addChild(obstacles);

	death_view = new PIXI.Container();
	stage.addChild(death_view);

	death_view.visible = false;
	death_view.interactive = false;

	game_view.visible = true;
	game_view.interactive = false;


	tutorial.visible = true;;

	title_view.visible = true;
	title_view.interactive = true;

	title_view.alpha = 70;

	dead = false;

	score_text = "Score: 0"
	player = {};
	
	player.jumping = false;
	player.hasJumped = false;

	first_positioning = true;
	first_run = true;

	first_platforms = [];

	speed = 3; // The overall scaling of the game speed

	game_on = false;
	
	dead = false // variable for death sound
	
	fall_speed = 5;

	game_on = false;

	p_collission = false; // collision for platforms

	platform_distance = 200;

	score = 0;

	distance_from_last = -200;
	last_y = 475;

	platform_1 = {};
	platform_2 = {};



	//player.runner;
	loadMenus();
	loadGame();
	generateInstructions();
}



function jump(){
	player.jumping = true;
	// Change animation 
	player.textures = [runningFrames[0]];
	player.hasJumped = true;
	player.play();
	var jump_time = 600 - speed;
	var jump_height = 160 + speed;
	
	// change player position
	jump_sound.play();
	createjs.Tween.get(player.position).to({y: (player.y - jump_height)}, jump_time); // tween the player to the max height, then let fall() do the rest
	window.setTimeout(function () { player.jumping = false; }, jump_time);

}

// collision with platforms //////////////////////////////////////////////////////////////////////
//

// Simulates gravity, player.y should be increasing (toward the bottom of the screen)
// unless there is an obstacle under him
function fall(){ 
	// check if player is jumping
	if (!player.jumping){	

		player.y += fall_speed;
		
		// check if player falls of the map
		offScreen();
	}
}


// checks if player coords are off screen,
// returns TRUE if the player is off screen
// returns FALSE if the player is still on the screen



function offScreen(){
	if(player.y - 120 > 500){
		if(!dead) fall_death_sound.play();
		die();
		dead = true;
	}
}


// puts the above movement functions into the collision function,
// so that when the player collides with something
// movement matches the collision


function collisionPlatform(){// platform x = 1, y = 0 = top right //player x = .5, y= 1 = feet
	if(p_collission){
	

	if(platform_1.on && player.x > (platform_1.segments[0].x-120) && player.x < (platform_1.segments[platform_1.segments.length-1].x + 20)){ // player inside edges of platform (mult by 120 to get pixels)
		if (player.y < platform_1.height + 40 || player.y > (platform_1.height + 70)){ // player is above/ below the platform	

			fall(); // fall() checks if the player is jumping
		}
		else {
			
			// Recreate player running animation and switch hasJumped to false
			player.textures = runningFrames;
			player.hasJumped = false;
			player.play();
		}
	}

	else if(platform_2.on && player.x > (platform_2.segments[0].x-120) && player.x < (platform_2.segments[platform_2.segments.length-1].x +20)){ // player inside edges of platform (mult by 120 to get pixels)
		if (player.y < platform_2.height + 40 || player.y > (platform_2.height + 70)){ // player is above/ below the platform
			fall();
		}
		else {
			
			// Recreate player running animation and switch hasJumped to false
			player.textures = runningFrames;
			player.hasJumped = false;
			player.play();
		}
	}
	
	// check if player is jumping
	else fall();
	}// Ends if(p_collission)


	else{ // player is in the first run bit of platform (the neverending platform)
		if(player.y < 420){
			fall();
		}

		else{

			player.textures = runningFrames;
			player.hasJumped = false;
			player.play();
		}

	}
}


//
// end collision with platforms //////////////////////////////////////////////////////////////////


// Changes the current displaying container
// Currently this only works for switching between children of stage
function changeView(view){

	//blip.play();

	for(var i=0; i<stage.children.length; i++){
		stage.children[i].visible = false;
		stage.children[i].interactive = false;
	}

	view.visible = true;
	view.interactive = true;
}

PIXI.loader
	.add('instructions.json')
	.load(generateInstructions);


function generateInstructions(centerX){

	for(var i = 0; i <= 800; i += 400){
		var	tutorial_sign = new PIXI.Sprite(PIXI.Texture.fromFrame("instructions_"+((i/400)+1)+".png"));
		tutorial.addChild(tutorial_sign);
		tutorial_sign.anchor.x = 1.0;
		tutorial_sign.anchor.y = .5;
		tutorial_sign.position.x = i*3 + 1600;
		tutorial_sign.position.y = 180;
}
}


function moveInstructions(speed){

	for(var i = 0; i < tutorial.children.length; i++){
		tutorial.children[i].position.x -= speed;
	}
}

// As long as there is less then 3 objects generate a new set of object 
// TODO: add other object groups
function generateObstacles(centerX, centerY) {
	
	var amount = Math.floor(Math.random() * (4 -1) + 1); // The top range in this formula for random is exclusive, 
	// so using floor the top range has to be one more then what you want
	
	for(i=0; i < amount; i++){
		var type = Math.floor(Math.random() * 3);
		
		var laser = new PIXI.extras.MovieClip(laserTextureArray[type]);
		
		var laserDeltaX = Math.floor(Math.random() * 400) - 200;
		var laserDeltaY = Math.floor(Math.random() * 100) - 50;
		
		laser.anchor.x = 0.5;
		laser.anchor.y = 0.5;
		
		laser.position.x = centerX + laserDeltaX;
		laser.position.y = centerY + laserDeltaY - 100;
		
		laser.animationSpeed = .25;
		laser.loop = true;
		laser.interactive = true;
		laser.on('mousedown', turnLaserOff.bind(null, laser));
		laser.type = type;
		laser.play();

		obstacles.addChild(laser);	
		
	}
}

function turnLaserOff(laser){

	laser_off_sound.play();
	setTimeout(1000, function(){laser_off_sound.pause();})
	
	var oldX = laser.x;
	var oldY = laser.y;
	var newLaser;
	switch (laser.type) {
		case 0:
			newLaser = new PIXI.extras.MovieClip([laserTextureArray[0][0]]);
			break;
		case 1:
			newLaser = new PIXI.extras.MovieClip([laserTextureArray[1][0]]);
			break;
		case 2:
			newLaser = new PIXI.extras.MovieClip([laserTextureArray[2][0]]);
			break;
	}
	
	newLaser.anchor.x = 0.5;
	newLaser.anchor.y = 0.5;
	
	newLaser.position.x = oldX;
	newLaser.position.y = oldY;
	
	newLaser.off = true;
	newLaser.animationSpeed = .25;
	newLaser.loop = true;
	newLaser.play();
	
	obstacles.removeChild(laser);
	obstacles.addChild(newLaser);	
}


  
// Cycles through each obstacle and moves based on the amount given
function moveObstacles(amount) {

	for(var j = 0; j < obstacles.children.length; j++){

		obstacles.children[j].position.x -= speed;

		if(obstacles.children[j].position.x + 62.5 <= 0){
			obstacles.removeChildAt(j);
			
		}
	}
}


// Cycles through each object and checks0 for collison
function checkCollison() {
	var playerX = player.position.x;
	var playerY = player.position.y;
	for(var j = 0; j < obstacles.children.length; j++){
		if(obstacles.children[j].off == true) {continue;}
		if(playerX > obstacles.children[j].x -62.5 && playerX < obstacles.children[j].x + 62.5) {
			var boundDiff = 0;
			if(obstacles.children[j].type == 0) {boundDiff = 10;}
			if(obstacles.children[j].type == 1) {boundDiff = 25;}
			if(obstacles.children[j].type == 2) {boundDiff = 35;}
			if(playerY - 125 <= obstacles.children[j].y + boundDiff && playerY >= obstacles.children[j].y - boundDiff) {
				laser_death_sound.play();
				die();
			}
		}
	}
}


function firstRun(){
		
		if(!(game_on)) return;



			if(first_positioning){
				for(var k = 0; k <= game_width + 240; k += 120){
					first_platforms[k / 120].position.x = k;
					first_positioning = false;
				}
			}


		//first_platforms[first_platforms.length-1].visible = false;
		for(var m = 0; m < first_platforms.length; m++){

			first_platforms[m].position.x -= speed;

		}

		if(first_platforms[first_platforms.length-1].position.x <= -120){
				platforms.removeChildren(0,9);
			
			first_platforms = [];		

			first_run = false;

		}


		else{
			requestAnimationFrame(firstRun);
		}
			
}








// Called when player collides with something or falls
function die() {
	
	changeView(death_view);
	game_view.visible = true;
	player.visible = false;
	dead = true;
	clearInterval(intervel);
}


function animate(){

	requestAnimationFrame(animate);
	scroller.update();

		if(game_on){
			if (platform_1.on || platform_2.on) {
				moveObstacles(speed);
				checkCollison();
				moveInstructions(speed);
			}

			if (platform_2.on){
				platform_2.update(speed);			

			} 

			if (platform_1.on){
				platform_1.update(speed);

				
				if(first_platforms[first_platforms.length-1] && first_platforms[first_platforms.length-1].x + 70 < player.x){ 
					p_collission = true;	
				}
			}
				// the initial creation of segments that were not an actual platform object have been removed from the screen
			
			collisionPlatform();



			if(distance_from_last >= platform_distance){
				if(!(platform_1.on)){
					
					platform_1 = new Platform(last_y, platforms);
					generateObstacles(platform_1.segments[Math.floor(platform_1.segments.length/2)].position.x, platform_1.height);
					
					num_signs += 1;
					last_y = platform_1.height;
					distance_from_last = -(platform_1.width*120);


				}

				else if(!(platform_2.on)){
					
					platform_2 = new Platform(last_y, platforms);
					generateObstacles(platform_2.segments[Math.floor(platform_2.segments.length/2)].position.x, platform_2.height);
					
					last_y = platform_2.height;			
					distance_from_last = -(platform_2.width*120);

				}
			}

			distance_from_last += speed;

			//platform_distance += speed;
				speed += .001;
				score += speed * 1.5;
			
	}

	else{

		for(var k = 0; k < platforms.children.length; k++){
		 
		 		platforms.children[k].position.x -= speed;
		 		
		 		if (platforms.children[k].position.x == -120){
		 			platforms.children[k].position.x = game_width + 120;
		 		}
		 	}
	}
	
	renderer.render(stage);

}


animate();