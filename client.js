let chessbot_server = "ws://127.0.0.1:4321/server";

let color_green = "rgb(52, 235, 79)";
let color_red = "rgb(235, 55, 52)";
let color_yellow = "rgb(229, 235, 52)";

let is_websocket_ready = false;

if(window.chessbot_from) {
    window.chessbot_from.remove();
}
window.chessbot_from = document.createElement("div");
window.chessbot_from.classList.add("square");
window.chessbot_from.id = "chessbot_from";
window.chessbot_from.style.transform = "translate(0%, 0%)";
window.chessbot_from.style.position = "relative";
window.chessbot_from.style.outline = "4px solid " + color_red;
window.chessbot_from.style.display = "none";

if(window.chessbot_to) {
    window.chessbot_to.remove();
}
window.chessbot_to = document.createElement("div");
window.chessbot_to.classList.add("square");
window.chessbot_to.id = "chessbot_to";
window.chessbot_to.style.transform = "translate(0%, 0%)";
window.chessbot_to.style.position = "relative";
window.chessbot_to.style.outline = "4px solid " + color_green;
window.chessbot_to.style.display = "none";

window.addEventListener("load", () => {
    let board = document.querySelector(".arrows-container");
    board.appendChild(window.chessbot_from);
    board.appendChild(window.chessbot_to);
})

let hide_move_displays = () => {
    window.chessbot_from.style.display = "none";
    window.chessbot_to.style.display = "none";
}

let display_from_to = (from, to) => {
    if(!window._game) return;
    
    window.chessbot_from.style.display = "block";
    window.chessbot_to.style.display = "block";

    const number_offset = "0".charCodeAt(0);
    let translation_map = {
        'a': 0,
        'b': 1,
        'c': 2,
        'd': 3,
        'e': 4,
        'f': 5,
        'g': 6,
        'h': 7,
    };

    if(window._game.game.setup.playingAs == 2) {
        window.chessbot_from.style.transform = `translate(${(7 - translation_map[from.charAt(0)]) * 100}%, ${((from.charCodeAt(1) - number_offset) - 1) * 100}%)`;
        window.chessbot_to.style.transform = `translate(${(7 - translation_map[to.charAt(0)]) * 100}%, ${((to.charCodeAt(1) - number_offset) - 2) * 100}%)`;
    } else {
        window.chessbot_from.style.transform = `translate(${translation_map[from.charAt(0)] * 100}%, ${(8 - (from.charCodeAt(1) - number_offset)) * 100}%)`;
        window.chessbot_to.style.transform = `translate(${translation_map[to.charAt(0)] * 100}%, ${(7 - (to.charCodeAt(1) - number_offset)) * 100}%)`;
    }
}

if(window.chessbot) {
    window.chessbot.remove();
}

window.chessbot = document.createElement("div");
window.chessbot.id = "chessbot";

window.chessbot.style.position = "fixed";
window.chessbot.style.top = "10px";
window.chessbot.style.right = "10px";
window.chessbot.style.background = "rgba(0,0,0,0.9)";
window.chessbot.style.padding = "10px";
window.chessbot.style.fontFamily = "monospace";
window.chessbot.style.zIndex = 999999;

document.body.appendChild(chessbot);

let set_status = (text, color) => {
    window.chessbot.innerText = text;
    window.chessbot.style.color = color;
}

set_status(`connecting to ${chessbot_server}`, color_yellow);

let socket = new WebSocket(chessbot_server);

socket.onopen = () => {
    set_status(`waiting for server hello`, color_yellow);
}

socket.onerror = socket.onclose = () => {
    set_status(`couldnt connect to server`, color_red);
}

socket.onmessage = (e) => {
    let message = JSON.parse(e.data);

    if(message.type == "status") {
        set_status(message.msg, message.color);
        is_websocket_ready = true;
    }

    if(message.type == "move") {
        display_from_to(message.move.from, message.move.to);
    }
}

window.chessbot_on_move = (instance) => {
    window._game = instance;

    if(is_websocket_ready && window._game.game.setup.sideToMove == window._game.game.setup.playingAs) {
        hide_move_displays();
        socket.send(JSON.stringify({
            "type": "move",
            "fen": window._game.game.setup.fen
        }));
    } else {
        hide_move_displays();
    }
}