var host = "localhost";
var port = 60000;
var DEBUG = false;
var net = require("net");
var crypto = require('crypto');

function pack(num) {
   var result = '';
   result += String.fromCharCode(num >> 24 & 0xFF);
   result += String.fromCharCode(num >> 16 & 0xFF);
   result += String.fromCharCode(num >> 8 & 0xFF);
   result += String.fromCharCode(num &  0xFF);
   return result;
}

function User(socket) {
   this.username;
   this.socket = socket;
   this.opponent;
   this.handshaked = false;
   this.inGame = false;

   this.handshake = function(data) {
      d = data.toString("binary");
      var _headers = d.split("\r\n");
      var upgradeHead = _headers[ _headers.length - 1 ];
      var sec1_regex = /Sec-WebSocket-Key1: (.*)\r\n/g;
      var sec2_regex = /Sec-WebSocket-Key2: (.*)\r\n/g;
      var origin_regex = /Origin: (.*)\r\n/g;
      var host_regex = /Host: (.*)\r\n/g;
      var ressource_regex = /GET (.*) HTTP/g;
      var protocol_regex = /Sec-WebSocket-Protocol: (.*)/g;
      var host = host_regex.exec(d)[1];
      var ressource = ressource_regex.exec(d)[1];
      var origin = origin_regex.exec(d)[1];
      var key1 = sec1_regex.exec(d)[1];
      var num1 = parseInt(key1.replace(/[^\d]/g, ""), 10)
      var key2 = sec2_regex.exec(d)[1];
      var num2 = parseInt(key2.replace(/[^\d]/g, ""), 10);
      var spaces1 = key1.replace(/[^\ ]/g, "").length;
      var spaces2 = key2.replace(/[^\ ]/g, "").length;
      if (spaces1 == 0 || spaces2 == 0 || num1 % spaces1 != 0 || num2 % spaces2 != 0) {}
      var hash = crypto.createHash("md5");
      var kkkey1 = pack(parseInt(num1/spaces1));
      var kkkey2 = pack(parseInt(num2/spaces2));
      hash.update(kkkey1);
      hash.update(kkkey2);
      hash.update(upgradeHead);
      this.socket.write("HTTP/1.1 101 Web Socket Protocol Handshake\r\n"
               + "Upgrade: WebSocket\r\n"
               + "Connection: Upgrade\r\n"
               + "Sec-WebSocket-Origin: "+origin+"\r\n" // Local sandbox
               + "Sec-WebSocket-Location: ws://"+host+ressource+"\r\n\r\n"
               + hash.digest("binary"), "binary");
      this.handshaked = true;
      log("Handshake done");
   };

   this.send = function(msg) {
      say("> "+msg);
      this.socket.write(String.fromCharCode(0)+msg+String.fromCharCode(255), "binary");
   };
}

var sockets = [];
var users = [];

var s = net.Server(function(socket) {
   sockets.push(socket);

   socket.addListener("connect", function() {
      log("CONNECT");
      var user = new User(this);
      users.push(user);
   });

   socket.on("data", function(d) {
      var user = getUserBySocket(this);
      if (user.handshaked) {
         process(user, d);
      } else {
         user.handshake(d);
      }
   });

   socket.on("end", function() {
      for (var i in users) {
         if (users[i].socket == socket) {
            var username = users[i].username;
            var opponent = users[i].opponent;
            if (opponent) {
               opponent.inGame = false;
               opponent.opponent = null;
               opponent.send('{"cmd":"opponent_has_left"}');
            }
            users.splice(i, 1);
            if (username) {
               broadcast('{"cmd":"logout", "username":"'+username+'"}');
            }
            break;
         }
      }
   });
});

function broadcast(msg) {
   for (var i in users) {
      users[i].send(msg);
   }
}

function process(user, data) {
   var d = data.toString().substring(1, data.toString().length-1);
   say("< "+d);
   var json = eval("("+d+")");
   switch (json.cmd) {
      case "connect":
         // The server accept only two person !
         if (users.length >= 300000) {
            user.send('{"cmd":"error", "msg":"The server accept only two players !"}');
            user.socket.end();
            return;
         }
         // Close the connection if the username is invalid.
         var usrname_rgx = new RegExp(/^[a-zA-Z0-9]{3,15}$/g);
         if (!json.username.match(usrname_rgx)) {
            user.send('{"cmd":"error", "msg":"Username must be 3 to 15 alphanum chars."}');
            user.socket.end();
            return;
         }
         // Close the connection if the username is already taken.
         for (var i in users) {
            if (users[i].username == json.username) {
               user.send('{"cmd":"error", "msg":"Username already taken."}');
               user.socket.end();
               return;
            }
         }

         user.username = json.username;

         var t = {"cmd":"test", "users":[]};
         for (var i in users)
            if (users[i].username != user.username)
               t.users.push(users[i].username);
         user.send(JSON.stringify(t));
         broadcast('{"cmd":"login", "username":"'+json.username+'"}');
         break;
      case "challenge":
         if (user.username == json.user) {
            user.send('{"cmd":"error", "msg":"You cannot challenge yourself."}');
            return;
         }

         var opponent = getUserByUsername(json.user);
         if (opponent == -1) {
            user.send('{"cmd":"error", "msg":"This user does not exist."}');
            return;
         }

         if (opponent.inGame) {
            user.send('{"cmd":"error", "msg":"This user is actually in a game."}');
            return;
         }

         opponent.send('{"cmd":"challenge", "user":"'+user.username+'"}');
         break;
      case "challengeRes":
         var u1 = getUserByUsername(json.user);
         if (json.res == "no") {
            u1.send('{"cmd":"error", "msg":"'+user.username+' refuse to challenge you."}');
            return;
         }

         if (u1.inGame) {
            user.send('{"cmd":"error", "msg":"'+u1.username+' is already in a game."}');
            return;
         }

         if (json.res == "yes") {
            u1.inGame = true;
            user.inGame = true;
            u1.send('{"cmd":"setPlayer", "username":"'+user.username+'", "team":"red"}');
            user.send('{"cmd":"setPlayer", "username":"'+user.username+'", "team":"silver"}');
            user.opponent = u1;
            u1.opponent = user;
            u1.send('{"cmd":"opponent_has_logged"}');
         }
         break;
      case "init_game":
         user.send('{"cmd":"game", "game": {"player":"red", "turns":1}, "lastMove": null }');
         user.opponent.send(d);
         break;
      case "message":
         if (trim(json.msg) == "") return;
         broadcast('{"cmd":"message", "msg":"'+user.username+': '+json.msg+'"}');
         break;
      case "game":
         user.opponent.send(d);
         break;
      default:
         broadcast(d);
         break;
   }
}

function getUserByUsername(username) {
   for (var i in users)
      if (users[i].username == username)
         return users[i];
   return -1;
}

function getUserBySocket(socket) {
   for (var i in users)
      if (users[i].socket == socket)
         return users[i];
}

s.listen(port, host);
say("Server listen on "+host+":"+port);
say(""+new Date()+"\n");

function say(msg) { console.log(msg); }
function log(msg) { if (DEBUG) console.log(msg); }
function trim(str) { return str.replace(/^\s+/g, '').replace(/\s+$/g, ''); } 
