var btnLogin;
var btnLogout;
var wsUri;
var txtUsername;
var websocket;
var isLogged = false;

// Chat
var btnSend;
var lstUsers;
var txtText;
var txtLog;
var ckbConfirm;

function log(msg) {
   var pre = document.createElement("p");
   pre.style.wordWrap = "break-word";
   pre.innerHTML = msg;
   txtLog.appendChild(pre);

   while (txtLog.childNodes.length > 50)
      txtLog.removeChild(txtLog.firstChild);

   txtLog.scrollTop = txtLog.scrollHeight;
}

function sc_open(e) {
   isLogged = true;
   setGui(isLogged);
   localStorage.setItem("txtUsername", txtUsername.value);
   localStorage.setItem("wsUri", wsUri.value);
   websocket.send('{"cmd":"connect", "username":"'+escape(txtUsername.value)+'"}');
}

function sc_close(e) {
   lstUsers.length = 0;

   // TODO: Look game_init state and remove ft var.
   ft = true;
   gameover = false;
   if (!isLogged) {
      log('<span class="error">Connection failed</span>');
   } else {
      isLogged = false;
      setGui(false);
      switchState("waiting_connection");
   }
}

function process(data) {
   var d = eval("("+data+")");
   switch (d.cmd) {
      case "message":
         log(unescape(d.msg));
         break;
      case "error":
         log('<span class="error">'+d.msg+'</span>');
         break;
      case "setPlayer":
         player.team = d.team;
         player.username = d.username;
         if (player.team == "red") {
            switchState("wait_opponent");
         } else {
            switchState("wait_opponent");
         }
         break;
      case "opponent_has_logged":
         switchState("pre_levels");
         break;
      case "opponent_has_left":
         //websocket.close();
         ft = true;
         gameover = false;
         switchState("waiting_connection");
         log('<span class="error">Your opponent has left.</span>');
         break;
      case "init_game":
         gameToLoad = d.gameId;
         switchState("game");
         break;
      case "challenge":
         var c = confirm(d.user+" chanllenge you.");
         if (c) {
            websocket.send('{"cmd":"challengeRes", "user":"'+d.user+'", "res":"yes"}');
         } else {
            websocket.send('{"cmd":"challengeRes", "user":"'+d.user+'", "res":"no"}');
         }
         break;
      case "test":
         for (var i in d.users) {
            var opt = document.createElement("option");
            opt.value = d.users[i];
            opt.text = d.users[i];
            lstUsers.options.add(opt);
         }
         break;
      case "login":
         var opt = document.createElement("option");
         opt.value = d.username;
         opt.text = d.username;
         lstUsers.options.add(opt);
         log('<span class="server">['+d.username+' login]</span>');
         break;
      case "logout":
         for (var i=0; i<lstUsers.length; i++) {
            if (lstUsers.options[i].value == d.username) {
               lstUsers.remove(i);
               break;
            }
         }
         log('<span class="server">['+d.username+' logout]</span>');
         break;
      case "game":
         GameData = d;
         if (ckbConfirm.value == "on") {
            if (GameData.lastMove == null) {
               switchState("animLastMove");
            } else {
               switchState("waitAnimLastMove");
            }
         } else {
            switchState("animLastMove");
         }
         break;
   }
}

function sc_message(e) {
   process(e.data);
   //console.log(e.data);
}

function sc_error(e) {
   console.log("Socket Error:" + e.data);
}

function btnLogin_click(e) {
   websocket = new WebSocket(wsUri.value);
   websocket.onopen = function(e) { sc_open(e); };
   websocket.onclose = function(e) { sc_close(e); };
   websocket.onmessage = function(e) { sc_message(e); };
   websocket.onerror = function(e) { sc_error(e); };
}

function btnLogout_click(e) {
   websocket.close();
}

function btnSend_click(e) {
   websocket.send('{"cmd":"message", "msg":"'+escape(txtText.value)+'"}');
   txtText.value = "";
}

function btnChallenge_click(e) {
   var u = lstUsers.options[lstUsers.selectedIndex].value;
   websocket.send('{"cmd":"challenge", "user":"'+u+'"}');
}

function setGui(isLogged) {
   wsUri.disabled = isLogged;
   txtUsername.disabled = isLogged;
   btnLogin.disabled = isLogged;
   btnLogout.disabled = !isLogged;

   btnSend.disabled = !isLogged;
   lstUsers.disabled = !isLogged;
   btnChallenge.disabled = !isLogged;
   txtText.disabled = !isLogged;
   txtLog.disabled = !isLogged;
}

function sc_init() {
   btnLogin = document.getElementById("btnLogin");
   btnLogin.addEventListener("click", btnLogin_click, false);

   btnLogout = document.getElementById("btnLogout");
   btnLogout.addEventListener("click", btnLogout_click, false);

   txtUsername = document.getElementById("txtUsername");
   txtUsername.value = localStorage.getItem("txtUsername");

   wsUri = document.getElementById("wsUri");
   wsUri.value = localStorage.getItem("wsUri");

   lstUsers = document.getElementById("lstUsers");
   lstUsers.addEventListener("dblclick", btnChallenge_click, false);

   btnChallenge = document.getElementById("btnChallenge");
   btnChallenge.addEventListener("click", btnChallenge_click, false);

   btnSend = document.getElementById("btnSend");
   btnSend.addEventListener("click", btnSend_click, false);

   txtText = document.getElementById("txtText");
   txtText.addEventListener("keydown", function(e) { if (e.keyCode == 13) btnSend_click(); }, false);
   txtLog = document.getElementById("txtLog");

   if (window.WebSocket == undefined)
      log('<span class="error">Your browser does not support WebSocket.</span>');

   ckbConfirm = document.getElementById("ckbConfirm");
   ckbConfirm.checked = localStorage.getItem("ckbConfirm") == "on" ? true : false;
   ckbConfirm.addEventListener("click", function(e) { localStorage.setItem("ckbConfirm", this.value); });

   setGui(false);
}

window.addEventListener("load", sc_init, false);
