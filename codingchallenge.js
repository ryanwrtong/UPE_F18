var url = "http://ec2-34-216-8-43.us-west-2.compute.amazonaws.com/session";
var maze;
var xmax;
var ymax;
var mazestate;
var solved = false;
var totlevels;

//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var request = new XMLHttpRequest();
request.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
    //Get game token
    var str = this.responseText;
    var token = str.split("\"")[3];
    url = "http://ec2-34-216-8-43.us-west-2.compute.amazonaws.com/game?token=" + token;
    
    //Get maze state
    for (var i = 0; i < 5; i++) {
      solved = false;
      var request2 = new XMLHttpRequest();
      request2.onreadystatechange =  function() {
        if (this.readyState == 4 && this.status == 200) {     
          mazestate = this.response;
          if (mazestate.status == "FINISHED") {
            console.log("FINISHED ALL LEVELS!")
            return 1;
          }

          //Update variables given new maze state
          var x = mazestate.current_location[0];  //x col
          var y = mazestate.current_location[1];  //y col
          xmax = mazestate.maze_size[0];  //width
          ymax = mazestate.maze_size[1];  //height
          totlevels = mazestate.total_levels;

          //Create 2d array for maze to draw out the maze
          maze = [];
          for (let c = 0; c < ymax; c++) {
            maze[c] = [];
            for (let b = 0; b < xmax; b++) {
              maze[c][b] = 0;
            }
          }

          maze[y][x] = 2; //Mark start location

          //solve one level
          if (x + 1 < xmax && !solved) {
            move("RIGHT",x+1,y);
          }
          if (x - 1 >= 0 && !solved) {
            move("LEFT",x-1,y);
          }
          if (y+1 < ymax && !solved) {
            move("DOWN",x,y+1);
          }
          if (y-1 >= 0 && !solved) {
            move("UP",x,y-1);
          }
        }
      }
      request2.open("GET", url, true);
      request2.responseType = 'json';
      request2.setRequestHeader("content-type", "application/x-www-form-urlencoded");
      request2.send();
    }
  }
}
request.open("POST", url, false); //CHANGED THIS TO FALSE
request.setRequestHeader("content-type", "application/x-www-form-urlencoded");
request.send("uid=904994581");

function move(curraction, x, y) {
  //make new move request
  var request3 = new XMLHttpRequest();
  request3.open("POST", url, false);
  request3.setRequestHeader("content-type", "application/x-www-form-urlencoded");
  request3.send("action=" + curraction);
  
  //Deal with responses to moving a direction
  var str = request3.responseText;
  var result = str.split("\"")[3];
  
  //finished with maze
  if (result == "END") {
    console.log("COMPLETED THE MAZE!");
    console.log("LEVELS DONE: " + mazestate.levels_completed);
    solved = true;
    return true;
  }
  
  //bumped into wall, so try a different direction
  if (result == "WALL") {
    maze[y][x] = 3;
    return false;
  }

  if (result == "OUT_OF_BOUNDS") {
    return false;
  }

  //moved in that direction
  if (result == "SUCCESS") {
    //Update the maze and position
    if (maze[y][x] == 1) {  //visited previously
      return false;
    }
    maze[y][x] = 1;
    
    //Move once again to an unknown space
    if (x+1 < xmax && !solved && !maze[y][x+1]) {
      move("RIGHT", x+1, y);
    }
    if (x-1 >= 0 && !solved && !maze[y][x-1]) {
        move("LEFT",x-1,y);
    }
    if (y+1 < ymax && !solved && !maze[y+1][x]) {
        move("DOWN",x,y+1);
    }
    if (y-1 >= 0 && !solved && !maze[y-1][x]) {
        move("UP",x,y-1);
    }
    
    //returned a move but not yet solved, so backtrack
    if(maze[y][x] == 1 && solved == false){
      let oppdir = null;
      if (curraction == "LEFT") {
        oppdir = "RIGHT";
      }
      else if (curraction == "RIGHT") {
        oppdir = "LEFT";
      }
      else if (curraction == "UP") {
        oppdir = "DOWN";
      }
      else if (curraction == "DOWN") {
        oppdir = "UP";
      }
      var request4 = new XMLHttpRequest();
      request4.open("POST", url, false);
      request4.setRequestHeader("content-type", "application/x-www-form-urlencoded");
      request4.send("action=" + oppdir);
      return false;
    }
  }
}