//--- Drawing functions -------------------------------------------------------
var simulation = false;
var caseSize = 30;
var gameToLoad = 0;
vars.levels = new Array();
var gameover = false;

var GameData = {
   "game": {
      "player":"red",
      "turns":1
   },
   "lastMove": {"old":{}, "new":{}}
};

var player = {"team":""};

function Laser(pos, direction) {
   this.pos = pos;
   this.direction = direction;
   this.kills = []; // Stock la/les pieces tués !
   this.create_time = new Date();

   var params = {"x":0, "y":0, "width":100, "height":100};
   Anim.call(this, params);

   this.destroy = function() {
      var self = this;
      this.animate({"opacity":0, "duration":0.3}, function() {
         for (var i in objs)
            if (objs[i] == self)
               objs.splice(i, 1);
      });
      
      for (var i in this.kills)
         this.kills[i].destroy();
   };

   this.onUpdate = function() {
      if (new Date() - this.create_time > 3000) {
         this.destroy();
      }
   };

   this.isInside = function(){
      return false;
   };

   this.kill = function(piece) {
      var find = false;
      for (var i in this.kills) {
         if (this.kills[i] == piece) {
            find = true;
            break;
         }
      }
      if (!find) {
         this.kills.push(piece);
      }
   };

   this.recurs = [];
   this.dirProc = [];
   this.path = function(start) {
      start = start != undefined ? start : false;
      if (start) {
         this.dirProc = [];
      }

      while(this.recurs.length > 0) {
         var line = this.recurs.pop();


         var a = false;
         for (var i in this.dirProc) {
            var enr = this.dirProc[i];
            if (enr.point.x == line.point.x && enr.point.y == line.point.y && enr.dir == line.dir) {
               a = true;
               break;
            }
         }

         if (!a) {
            this.dirProc.push({"point":new Point(line.point.x, line.point.y), "dir":line.dir});

            c.beginPath();
            var tmp = new Point(line.point.x, line.point.y);
            var tmpDir = line.dir;
            var piece;
            
            var laserStartPoint = new Point(tmp.x*(caseSize+2)+caseSize/2, tmp.y*(caseSize+2)+caseSize/2);
            if (start) {
               start = false;
               switch (tmpDir) {
                  case 0: laserStartPoint.y += caseSize/2; break;
                  case 1: laserStartPoint.x -= caseSize/2; break;
                  case 2: laserStartPoint.y -= caseSize/2; break;
                  case 3: laserStartPoint.x += caseSize/2; break;
               }
            }

            c.moveTo(laserStartPoint.x+0.5, laserStartPoint.y+0.5);
            
            var end = false;
            while (!end) {
               switch (tmpDir) {
                  case 0: tmp.y++; break;
                  case 1: tmp.x--; break;
                  case 2: tmp.y--; break;
                  case 3: tmp.x++; break;
               }

               if (tmp.x > 9 || tmp.x < 0 || tmp.y > 7 || tmp.y < 0) end = true;

               piece = vars.pieces[tmp.x] != undefined ? vars.pieces[tmp.x][tmp.y] : undefined;
               if (piece != undefined) {
                  var po = piece.orientation;
                  switch (piece.id) {
                     case "scarab":
                        if (tmpDir == 0 && (po == 0 || po == 2)) { tmpDir = 1; }
                        else if (tmpDir == 0 && (po == 1 || po == 3)) { tmpDir = 3; }
                        else if (tmpDir == 1 && (po == 0 || po == 2)) { tmpDir = 0; }
                        else if (tmpDir == 1 && (po == 1 || po == 3)) { tmpDir = 2; }
                        else if (tmpDir == 2 && (po == 0 || po == 2)) { tmpDir = 3; }
                        else if (tmpDir == 2 && (po == 1 || po == 3)) { tmpDir = 1; }
                        else if (tmpDir == 3 && (po == 0 || po == 2)) { tmpDir = 2; }
                        else if (tmpDir == 3 && (po == 1 || po == 3)) { tmpDir = 0; }
                        break;
                     case "pyramid":
                        if (tmpDir == 0 && po == 0) { this.kill(piece); end = true; }
                        else if (tmpDir == 0 && po == 1) { this.kill(piece); end = true; }
                        else if (tmpDir == 0 && po == 2) { tmpDir = 1; }
                        else if (tmpDir == 0 && po == 3) { tmpDir = 3; }
                        else if (tmpDir == 1 && po == 0) { tmpDir = 0; }
                        else if (tmpDir == 1 && po == 1) { this.kill(piece); end = true; }
                        else if (tmpDir == 1 && po == 2) { this.kill(piece); end = true; }
                        else if (tmpDir == 1 && po == 3) { tmpDir = 2; }
                        else if (tmpDir == 2 && po == 0) { tmpDir = 3; }
                        else if (tmpDir == 2 && po == 1) { tmpDir = 1; }
                        else if (tmpDir == 2 && po == 2) { this.kill(piece); end = true; }
                        else if (tmpDir == 2 && po == 3) { this.kill(piece); end = true; }
                        else if (tmpDir == 3 && po == 0) { this.kill(piece); end = true; }
                        else if (tmpDir == 3 && po == 1) { tmpDir = 0; }
                        else if (tmpDir == 3 && po == 2) { tmpDir = 2; }
                        else if (tmpDir == 3 && po == 3) { this.kill(piece); end = true; }
                        break;
                     case "anubis":
                        if (tmpDir == 0 && (po == 0 || po == 1 || po == 3)) { this.kill(piece); }
                        else if (tmpDir == 1 && (po == 0 || po == 1 || po == 2)) { this.kill(piece); }
                        else if (tmpDir == 2 && (po == 1 || po == 2 || po == 3)) { this.kill(piece); }
                        else if (tmpDir == 3 && (po == 0 || po == 2 || po == 3)) { this.kill(piece); }
                        end = true;
                        break;
                     case "horus":
                        if (tmpDir == 0 && (po == 0 || po == 2)) {
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":0});
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":1});
                        } else if (tmpDir == 0 && (po == 1 || po == 3)) {
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":0});
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":3});
                        } else if (tmpDir == 1 && (po == 0 || po == 2)) {
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":0});
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":1});
                        } else if (tmpDir == 1 && (po == 1 || po == 3)) {
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":1});
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":2});
                        } else if (tmpDir == 2 && (po == 0 || po == 2)) {
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":2});
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":3});
                        } else if (tmpDir == 2 && (po == 1 || po == 3)) {
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":1});
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":2});
                        } else if (tmpDir == 3 && (po == 0 || po == 2)) {
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":2});
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":3});
                        } else if (tmpDir == 3 && (po == 1 || po == 3)) {
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":0});
                           this.recurs.push({"point":new Point(tmp.x, tmp.y), "dir":3});
                        }
                        end = true;
                        break;
                     case "sphinx":
                        end = true;
                        break;
                     case "pharao":
                        gameover = true;
                        this.kill(piece);
                        end = true;
                        break;
                     default: this.kill(piece); end = true; break;
                  }
               }
               c.lineTo(tmp.x*(caseSize+2)+caseSize/2+0.5, tmp.y*(caseSize+2)+(caseSize/2)+0.5);
            }
            c.stroke();
         }
      }
   };

   this.onPaint = function() {
      c.save();
      c.strokeStyle = "rgba(255, 0, 0, 0.7)";
      c.lineWidth = 2;

      this.recurs.push({"point":new Point(this.pos.x, this.pos.y), "dir":this.direction});
      this.path(true);

      c.restore();
   };
}

var selectedPiece = null;
function selectPiece(piece) {
   if (selectedPiece == piece) {
      selectedPiece = null;
   } else {
      selectedPiece = piece;
   }
}

function Arrow(pos, action) {
   this.action = action;
   var params = {"img":medias[6], "x":pos.x, "y":pos.y, "width":50, "height":40, "frame":this.action};
   Sprite.call(this, params);

   this.onClick = function() {
      if (state != "game") return;
      if (!selectedPiece) return;
      var hasMoved = false;
      switch (this.action) {
         case 0: hasMoved = selectedPiece.turnLeft(); break;
         case 1: hasMoved = selectedPiece.turnRight(); break;
         case 2: hasMoved = selectedPiece.move(1); break;
         case 3: hasMoved = selectedPiece.move(6); break;
         case 4: hasMoved = selectedPiece.move(0); break;
         case 5: hasMoved = selectedPiece.move(3); break;
         case 6: hasMoved = selectedPiece.move(4); break;
         case 7: hasMoved = selectedPiece.move(7); break;
         case 8: hasMoved = selectedPiece.move(5); break;
         case 9: hasMoved = selectedPiece.move(2); break;
      }

      if (!hasMoved) {
         switchState("game");
      }
   };
}
function drawOptions() {
   vars.options = {};
   vars.options.btnTurnLeft = new Arrow(new Point(375, 20), 0);
   vars.options.btnTurnRight = new Arrow(new Point(425, 20), 1);
   vars.options.btnMvTL = new Arrow(new Point(350, 60), 4);
   vars.options.btnMvT = new Arrow(new Point(400, 60), 2);
   vars.options.btnMvTR = new Arrow(new Point(450, 60), 9);
   vars.options.btnMvL = new Arrow(new Point(350, 100), 5);
   vars.options.btnMvR = new Arrow(new Point(450, 100), 6);
   vars.options.btnMvBL = new Arrow(new Point(350, 140), 8);
   vars.options.btnMvB = new Arrow(new Point(400, 140), 3);
   vars.options.btnMvBR = new Arrow(new Point(450, 140), 7);
}

function endTurn(params) {
   var oldPos = new Point(selectedPiece.pos.x, selectedPiece.pos.y);
   var oldOrientation = selectedPiece.orientation;
   switch (params.move) {
      case 0: oldPos.x++; oldPos.y++; break;
      case 1: oldPos.y++; break;
      case 2: oldPos.x--; oldPos.y++; break;
      case 3: oldPos.x++; break;
      case 4: oldPos.x--; break;
      case 5: oldPos.x++; oldPos.y--; break;
      case 6: oldPos.y--; break;
      case 7: oldPos.x--; oldPos.y--; break;
      case 10: oldOrientation--; break;
      case 11: oldOrientation++; break;
   }
   GameData.lastMove = {};
   GameData.lastMove.old = {"id":selectedPiece.id, "team":selectedPiece.team, "point":{"x":oldPos.x, "y":oldPos.y}, "orientation":oldOrientation};
   GameData.lastMove.new = {"id":selectedPiece.id, "team":selectedPiece.team, "point":{"x":selectedPiece.pos.x, "y":selectedPiece.pos.y}, "orientation":selectedPiece.orientation};
   GameData.lastMove.action = params.move;
   selectedPiece = null;


   if (simulation) {
      if (GameData.game.player != "red") {
         new Laser(new Point(0, 0), vars.pieces[0][0].orientation);
      } else {
         new Laser(new Point(9, 7), vars.pieces[9][7].orientation);
      }
   } else {
      if (GameData.game.player == "red") {
         new Laser(new Point(0, 0), vars.pieces[0][0].orientation);
      } else {
         new Laser(new Point(9, 7), vars.pieces[9][7].orientation);
      }
      GameData.game.player = GameData.game.player == "red" ? "silver" : "red";
      GameData.game.turns++;
      websocket.send(JSON.stringify(GameData));
   }
}

function Piece(id, team, pos, orientation) {
   this.id = id;
   this.team = team;
   this.pos = pos;
   this.orientation = orientation;

   var frame = team == "red" ? 0 : 6;
   switch (id) {
      case "pharao": frame += 0; break;
      case "anubis": frame += 1; break;
      case "scarab": frame += 2; break;
      case "pyramid": frame += 3; break;
      case "sphinx": frame += 4; break;
      case "horus": frame += 5; break;
   }
   var angle = orientation * Math.PI/2;
   var params = {"img":medias[5], "angle":angle, "frame":frame, "x":pos.x*(caseSize+2)+1, "y":pos.y*(caseSize+2)+1, "width":caseSize, "height":caseSize};

   Sprite.call(this, params);

   this.turnLeft = function() {
      if (state != "animLastMove")
         switchState("move");
      var self = this;
      this.orientation++;
      if (this.orientation > 3)
         this.orientation = 0;

      medias[7].play();
      this.animate({"rotate":this.angle+Math.PI/2, "duration":0.7}, function() {
         self.angle = self.orientation * Math.PI/2;
         endTurn({"move":10});
      });
   };
   
   this.turnRight = function() {
      if (state != "animLastMove")
         switchState("move");
      var self = this;
      this.orientation--;
      if (this.orientation < 0)
         this.orientation = 3;
      
      if (this.angle-Math.PI/2 <= 0) { this.angle += 2*Math.PI; }
      medias[7].play();
      this.animate({"rotate":this.angle-Math.PI/2, "duration":0.7}, function() {
         self.angle = self.orientation * Math.PI/2;
         endTurn({"move":11});
      });
   };

   this.move = function(direction) {
      if (state != "animLastMove")
         switchState("move");
      var tmpPos = new Point(this.pos.x, this.pos.y);
      switch (direction) {
         case 0: tmpPos.x--; tmpPos.y--; break;
         case 1: tmpPos.y--; break;
         case 2: tmpPos.x++; tmpPos.y--; break;
         case 3: tmpPos.x--; break;
         case 4: tmpPos.x++; break;
         case 5: tmpPos.x--; tmpPos.y++; break;
         case 6: tmpPos.y++; break;
         case 7: tmpPos.x++; tmpPos.y++; break;
      }

      if (tmpPos.x < 0) return false;
      if (tmpPos.x > 9) return false;
      if (tmpPos.y < 0) return false;
      if (tmpPos.y > 7) return false;

      switch (this.team) {
         case "red":
            if (tmpPos.x >= 9) return false;
            if (tmpPos.x == 1 && tmpPos.y == 0) return false;
            if (tmpPos.x == 1 && tmpPos.y == 7) return false;
            break;
         case "silver":
            if (tmpPos.x <= 0) return false;
            if (tmpPos.x == 8 && tmpPos.y == 0) return false;
            if (tmpPos.x == 8 && tmpPos.y == 7) return false;
            break;
      }

      var self = this;
      switch (this.id) {
         case "sphinx":
            return false;
            break;
         case "scarab":
         case "horus":
            var piece = vars.pieces[tmpPos.x][tmpPos.y];
            if (piece == undefined) {
            } else if (piece.id == "scarab" || piece.id == "horus" || piece.id == "sphinx" || piece.id == "pharao") {
               return false;
            } else {
               // Si la pièce est sur une case réservé à sa couleur, elle ne peut swapper avec
               // une autre pièce d'une autre couleur.
               if (this.team == "red" && (this.pos.x <= 0 || (this.pos.x == 8 && (this.pos.y == 0 || this.pos.y == 7))) && piece.team == "silver") return false;
               if (this.team == "silver" && (this.pos.x >= 9 || (this.pos.x == 1 && (this.pos.y == 0 || this.pos.y == 7))) && piece.team == "red") return false;

               vars.pieces[tmpPos.x][tmpPos.y] = null;

               medias[7].play();

               var pieceNewPos = new Point(this.pos.x, this.pos.y);
               piece.animate({"to":new Point(this.pos.x*(caseSize+2)+1, this.pos.y*(caseSize+2)+1), "effect":"<>", "duration":0.7}, function() {
                  vars.pieces[pieceNewPos.x][pieceNewPos.y] = piece;
                  vars.pieces[pieceNewPos.x][pieceNewPos.y].pos = new Point(pieceNewPos.x, pieceNewPos.y);   
               });

               this.animate({"to":new Point(tmpPos.x*(caseSize+2)+1, tmpPos.y*(caseSize+2)+1), "effect":"<>", "duration":0.7}, function() {
                  vars.pieces[tmpPos.x][tmpPos.y] = self;
                  self.pos = new Point(tmpPos.x, tmpPos.y);
                  endTurn({"move":direction});
               });

               return true;
            }
            break;
         default:
            if (vars.pieces[tmpPos.x][tmpPos.y] != undefined) return false;
            break;
      }

      medias[7].play();
      this.animate({"to":new Point(tmpPos.x*(caseSize+2)+1, tmpPos.y*(caseSize+2)+1), "effect":"<>", "duration":0.7}, function() {
         vars.pieces[self.pos.x][self.pos.y] = null;
         vars.pieces[tmpPos.x][tmpPos.y] = self;
         self.pos = new Point(tmpPos.x, tmpPos.y);
         endTurn({"move":direction});
      });
      return true;

   };

   this.onClick = function(e) {
      if (state == "game")
         if (GameData.game.player == player.team)
            if (this.team == player.team)
               selectPiece(this);
   };

   this.onPaint = function() {
      var frameh = 0;
      var framew = this.frame;
      if (this.frame >= this.img.width / this.width) {
         framew -= this.img.width / this.width;
         frameh++;
      }
      c.save();
      //this.x = this.pos.x*(caseSize+2)+1;
      //this.y = this.pos.y*(caseSize+2)+1;
      c.drawImage(this.img, framew*this.width, frameh*this.height, this.width, this.height, this.x, this.y, this.width, this.height);
      if (selectedPiece == this) {
         c.strokeStyle = "green";
         c.lineWidth = 3;
         c.strokeRect(this.x, this.y, this.width, this.height);
      }
      c.restore();
   };

   this.destroy = function() {
      var self = this;
      medias[8].play();
      this.animate({"opacity":0, "duration":1}, function() {
         vars.map[self.pos.x][self.pos.y] = 0;
         for (var i in objs)
            if (objs[i] == self)
               objs.splice(i, 1);

         for (var i=0; i<10; i++) {
            for (var j=0; j<8; j++) {
               if (vars.pieces[i] != undefined && vars.pieces[i][j] == self) {
                  vars.pieces[i][j] = undefined;
               }
            }
         }
      });
   };
}

function drawBorder() {
   c.strokeRect(0.5, 0.5, canvas.width-0.5, canvas.height-0.5);
}

function drawBoard() {
   c.save();
   c.fillStyle = "#3e4245";
   c.strokeStyle = "#62626b";
   for (var i=0; i<10; i++) {
      for (var j=0; j<8; j++) {
         c.fillRect(i*(caseSize+2), j*32, (caseSize+2), (caseSize+2));
         c.strokeRect(i*(caseSize+2)+0.5, j*(caseSize+2)+0.5, caseSize+1.5, caseSize+1.5);
      }
   }
   c.drawImage(medias[4], 1, 0*(caseSize+2)+1);
   c.drawImage(medias[4], 1, 1*(caseSize+2)+1);
   c.drawImage(medias[4], 1, 2*(caseSize+2)+1);
   c.drawImage(medias[4], 1, 3*(caseSize+2)+1);
   c.drawImage(medias[4], 1, 4*(caseSize+2)+1);
   c.drawImage(medias[4], 1, 5*(caseSize+2)+1);
   c.drawImage(medias[4], 1, 6*(caseSize+2)+1);
   c.drawImage(medias[4], 1, 7*(caseSize+2)+1);
   c.drawImage(medias[4], 8*(caseSize+2)+1, 0*(caseSize+2)+1);
   c.drawImage(medias[4], 8*(caseSize+2)+1, 7*(caseSize+2)+1);

   c.drawImage(medias[3], 1*(caseSize+2)+1, 0*(caseSize+2)+1);
   c.drawImage(medias[3], 9*(caseSize+2)+1, 0*(caseSize+2)+1);
   c.drawImage(medias[3], 9*(caseSize+2)+1, 1*(caseSize+2)+1);
   c.drawImage(medias[3], 9*(caseSize+2)+1, 2*(caseSize+2)+1);
   c.drawImage(medias[3], 9*(caseSize+2)+1, 3*(caseSize+2)+1);
   c.drawImage(medias[3], 9*(caseSize+2)+1, 4*(caseSize+2)+1);
   c.drawImage(medias[3], 9*(caseSize+2)+1, 5*(caseSize+2)+1);
   c.drawImage(medias[3], 9*(caseSize+2)+1, 6*(caseSize+2)+1);
   c.drawImage(medias[3], 9*(caseSize+2)+1, 7*(caseSize+2)+1);
   c.drawImage(medias[3], 1*(caseSize+2)+1, 7*(caseSize+2)+1);

   // Draw turn.
   c.fillStyle = "#000";
   c.font = "16px sans-serif";
   c.fillText("You are: "+player.team, 350, 210);
   c.fillText(GameData.game.player+"'s turn", 350, 230);
   c.fillText("Turn: "+GameData.game.turns, 350, 250);
   c.restore();
}
//-----------------------------------------------------------------------------


//--- States ------------------------------------------------------------------
function splash_init() {
   var b1 = new Label({"text":"Game made by Alain Gilbert", "opacity":1, "baseline":"bottom", "align":"center", "font":"25px sans-serif", "x":canvas.width/2, "y":canvas.height/2});
   b1.animate({"duration":0.5, "opacity":0, "start":1.5});

   animationsComplete = function() {
      switchState("waiting_connection");
   };
}
function splash_end() {

   objs = new Array();
}
//-----------------------------------------------------------------------------
function waiting_connection_init() {
   objs = new Array();

   var button = document.getElementById("btnLogin");
   button.disabled = false;

   vars.waiting = new Label({"text":"Waiting connection", "opacity":0, "baseline":"bottom", "align":"center", "font":"25px sans-serif", "x":canvas.width/2, "y":canvas.height/2});
   vars.waiting.animate({"duration":0.5, "opacity":1, "start":0.5});
}

function waiting_connection_end() {
   objs = new Array();
}
//-----------------------------------------------------------------------------
function wait_opponent_init() {
   vars.waiting = new Label({"text":"Waiting opponent", "opacity":0, "baseline":"bottom", "align":"center", "font":"25px sans-serif", "x":canvas.width/2, "y":canvas.height/2});
   vars.waiting.animate({"duration":0.5, "opacity":1, "start":0.5});
}
function wait_opponent_end() {
   objs = new Array();
}
//-----------------------------------------------------------------------------
function BlockLabel(params) {
   Anim.call(this, params);
   this.text = params.text;
   this.onPaint = function() {
      c.save();
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.font = "20px sans-serif";
      c.fillText(this.text, this.x+(this.width/2), this.y+(this.height/2));
      c.strokeRect(this.x, this.y, this.width, this.height);
      c.restore();
   };
}
function pre_levels_init() {
   vars.b1 = new Anim({"img": medias[0], "x":0, "y":100, "scale":50});
   vars.b1.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width/3-vars.b1.width, 100)});

   vars.t1 = new Label({"text":"Classic", "font":"20px sans-serif", "x":0, "y":250, "align":"center"});
   vars.t1.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width/3-vars.b1.width/2, 250)});

   vars.b2 = new Anim({"img": medias[1], "x":0, "y":100, "scale":50});
   vars.b2.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width/2-vars.b2.width/2, 100)});

   vars.t2 = new Label({"text":"Dynasty", "font":"20px sans-serif", "x":0, "y":250, "align":"center"});
   vars.t2.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width/2, 250)});
   
   vars.b3 = new Anim({"img": medias[2], "x":0, "y":100, "scale":50});
   vars.b3.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width-(canvas.width/3), 100)});

   vars.t3 = new Label({"text":"Imhotep", "font":"20px sans-serif", "x":0, "y":250, "align":"center"});
   vars.t3.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width-(canvas.width/3)+vars.b3.width/2, 250)});

   vars.t4 = new BlockLabel({"text":"Osiris", "x":0, "y":300, "width":100, "height":30});
   vars.t4.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width/3, 300)});

   vars.t5 = new BlockLabel({"text":"Isis", "x":0, "y":300, "width":100, "height":30});
   vars.t5.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width-(canvas.width/3), 300)});

   vars.t6 = new BlockLabel({"text":"Classic²", "x":0, "y":350, "width":100, "height":30});
   vars.t6.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width/3-(canvas.width/3/2), 350)});

   vars.t7 = new BlockLabel({"text":"Imhotep²", "x":0, "y":350, "width":100, "height":30});
   vars.t7.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width/3, 350)});

   vars.t8 = new BlockLabel({"text":"Dynasty²", "x":0, "y":350, "width":100, "height":30});
   vars.t8.animate({"duration": 1, "effect":"elastic", "to":new Point(canvas.width-canvas.width/3, 350)});

   animationsComplete = function() {
      switchState("levels");
   };
}
//-----------------------------------------------------------------------------
function levels_init() {
   vars.b1.onMouseOver = function(e) {
      this.focus();
      this.animate({"duration":0.2, "scale":100});
   };
   vars.b1.onMouseOut = function(e) {
      this.animate({"duration":0.2, "scale":50});
   };


   vars.b2.onMouseOver = function(e) {
      this.focus();
      this.animate({"duration":0.2, "scale":100});
   };
   vars.b2.onMouseOut = function(e) {
      this.animate({"duration":0.2, "scale":50});
   };


   vars.b3.onMouseOver = function(e) {
      this.focus();
      this.animate({"duration":0.2, "scale":100});
   };
   vars.b3.onMouseOut = function(e) {
      this.animate({"duration":0.2, "scale":50});
   };

   vars.b1.onClick = lvlClick;
   vars.b2.onClick = lvlClick;
   vars.b3.onClick = lvlClick;

   vars.t4.onClick = lvlClick;
   vars.t5.onClick = lvlClick;
   vars.t6.onClick = lvlClick;
   vars.t7.onClick = lvlClick;
   vars.t8.onClick = lvlClick;
}
function lvlClick() {
   switch (this) {
      case vars.b1: gameToLoad = 0; break;
      case vars.b2: gameToLoad = 1; break;
      case vars.b3: gameToLoad = 2; break;
      case vars.t4: gameToLoad = 3; break;
      case vars.t5: gameToLoad = 4; break;
      case vars.t6: gameToLoad = 5; break;
      case vars.t7: gameToLoad = 6; break;
      case vars.t8: gameToLoad = 7; break;
   }
   vars.b1.onClick = function() {};
   vars.b1.onMouseOver = function() {};
   vars.b1.onMouseOut = function() {};
   vars.b2.onClick = function() {};
   vars.b2.onMouseOver = function() {};
   vars.b2.onMouseOut = function() {};
   vars.b3.onClick = function() {};
   vars.b3.onMouseOver = function() {};
   vars.b3.onMouseOut = function() {};
   vars.t4.onClick = function() {};
   vars.t4.onMouseOver = function() {};
   vars.t4.onMouseOut = function() {};
   vars.t5.onClick = function() {};
   vars.t5.onMouseOver = function() {};
   vars.t5.onMouseOut = function() {};
   vars.t5.onMouseOut = function() {};
   vars.t6.onClick = function() {};
   vars.t6.onMouseOver = function() {};
   vars.t6.onMouseOut = function() {};
   vars.t7.onClick = function() {};
   vars.t7.onMouseOver = function() {};
   vars.t7.onMouseOut = function() {};
   vars.t8.onClick = function() {};
   vars.t8.onMouseOver = function() {};
   vars.t8.onMouseOut = function() {};
   this.animate({"duration":0.2, "scale":50}, function() { switchState("post_levels"); });
}
//-----------------------------------------------------------------------------
function post_levels_init() {
   vars.b1.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 100), "effect":"backIn"});
   vars.b2.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 100), "effect":"backIn"});
   vars.b3.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 100), "effect":"backIn"});
   vars.t1.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 250), "effect":"backIn"});
   vars.t2.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 250), "effect":"backIn"});
   vars.t3.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 250), "effect":"backIn"});
   vars.t4.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 300), "effect":"backIn"});
   vars.t5.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 300), "effect":"backIn"});
   vars.t6.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 350), "effect":"backIn"});
   vars.t7.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 350), "effect":"backIn"});
   vars.t8.animate({"duration":0.5, "to":new Point(canvas.width+ 100, 350), "effect":"backIn"});

   animationsComplete = function() {
      setTimeout(function() { websocket.send('{"cmd":"init_game", "gameId":'+gameToLoad+'}'); }, 200);
   };
}
//-----------------------------------------------------------------------------
function laser_init() {
   animationsComplete = function() {
      if (gameover) {
         switchState("gameover");
      } else {
         switchState("game");
      }
      simulation = false;
   };
}
function laser_paint() {
   drawBoard();
}
//-----------------------------------------------------------------------------
function gameover_init() {
}
function gameover_paint() {
   drawBoard();
}
//-----------------------------------------------------------------------------
function move_init() {
   animationsComplete = function() {
      switchState("laser");
   };
}
function move_paint() {
   drawBoard();
}
//-----------------------------------------------------------------------------
function waitAnimLastMove_init() {
   var conf = new Anim({"x":0, "y":0, "opacity":0, "width":canvas.width, "height": canvas.height});
   conf.animate({"duration":0.3, "opacity":1});
   conf.onClick = function(e) {
      this.onClick = function(e) {};
      this.animate({"duration":0.2, "opacity":0}, function() {
         for (var i in objs)
            if (objs[i] == conf)
               objs.splice(i, 1);
         setTimeout(function() { switchState("animLastMove"); }, 500);
      });
   };
   conf.onPaint = function() {
      c.save();
      c.fillStyle = "rgba(0,0,0,0.6)";
      c.fillRect(this.x, this.y, this.width, this.height);

      c.fillStyle = "rgba(255,255,255,0.7);";
      c.font = "50px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("Your opponent", canvas.width/2, canvas.height/2-30);
      c.fillText("has played", canvas.width/2, canvas.height/2+30);
      c.restore();
   };
}
function waitAnimLastMove_paint() {
   drawBoard();
}
//-----------------------------------------------------------------------------
function animLastMove_init() {
   if (GameData.lastMove == null) {
      switchState("game");
      return;
   }

   simulation = true;
   var tmpPos = GameData.lastMove.old.point;
   var action = GameData.lastMove.action;
   selectedPiece = vars.pieces[tmpPos.x][tmpPos.y];
   switch (action) {
      case 10: selectedPiece.turnLeft(); break;
      case 11: selectedPiece.turnRight(); break;
      default: selectedPiece.move(action); break;
   }
   animationsComplete = function() {
      switchState("laser");
   };
}
function animLastMove_paint() {
   drawBoard();
}
//-----------------------------------------------------------------------------
function pre_game_init() {
   if (GameData.lastMove == null) {
      switchState("game");
      return;
   } else if (GameData.game.player != player.team) {
      switchState("game");
      return;
   }

   switchState("animLastMove");
}
//-----------------------------------------------------------------------------
var ft = true;
function game_init() {
   if (ft) {
      ft = false;
      
      // init map.
      drawOptions();
      vars.pieces = new Array();
      vars.map = new Array();
      for (var i=0; i<10; i++) {
         vars.pieces[i] = new Array();
         vars.map[i] = new Array();
         for (var j=0; j<8; j++) {
            vars.map[i][j] = 0;
         }
      }

      // Create pieces.
      var pieces = vars.levels[gameToLoad].pieces;
      for (var i in pieces) {
         var id = pieces[i].id;
         var team = pieces[i].team;
         var pos = pieces[i].point;
         var orientation = pieces[i].orientation;
         vars.pieces[pos.x][pos.y] = new Piece(id, team, pos, orientation);
         vars.map[pos.x][pos.y] = 1
      }
   }
}

function game_paint() {
   drawBoard();
}
//-----------------------------------------------------------------------------

// This function is call for all state and will paint over objs.
function post_paint() {
   drawBorder();
}

function init() {
   var loader = new Loader();
   loader.load(["img/classic.png", "img/dynasty.png", "img/imhotep.png",
                "img/ankh.png", "img/eye.png", "img/sprite.png", "img/arrows.png",
                "sounds/move.ogg", "sounds/kill.ogg"]);

   loader.complete = function() {
   console.log('CRISSSS INIT');
      switchState("splash");
      bindKeys();
   };
}
