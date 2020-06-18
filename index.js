const chess_com_js_url = "https://betacssjs.chesscomfiles.com/bundles/live/beta/live.client.a6f898be.js";

const ws = require("ws");
const fetch = require("node-fetch");
const uuid = require("uuid");
const http = require("http");
const url = require("url");
const fs = require("fs");
const express = require("express");

const color_green = "rgb(52, 235, 79)";
const color_red = "rgb(235, 55, 52)";
const color_yellow = "rgb(229, 235, 52)";

let chess_js = "alert('chessbot server didnt load yet, please wait')";

const app = express();
const server = http.createServer(app);
const wss = new ws.Server({ noServer: true });

let cache = {};

let get_best_move = async (fen) => {
	if(!!cache[fen]) return cache[fen];

	console.log(`[+] fetching best move for \"${fen}\"`);

	let data = await fetch("https://chesshub.com/api/v1/fens.json", {
		"headers": {
			"accept": "application/json, text/plain, */*",
			"accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7",
			"content-type": "application/json;charset=UTF-8",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
		},
		"referrer": "https://chesshub.com/analysis/1722757/edit",
		"referrerPolicy": "strict-origin-when-cross-origin",
		"body": JSON.stringify({
			"fen":fen
		}),
		"method": "POST",
		"mode": "cors",
		"credentials": "include"
	});

	let move = (await data.json()).analysis.move;
	let move_repr = move.from + move.to;

	console.log(`[+] resolved \"${fen}\" to ${move_repr}`);

	cache[fen] = move;
	return move;
}

// let get_best_move = async (fen) => {
// 	if(!!cache[fen]) return cache[fen];

// 	console.log(`[+] fetching best move for \"${fen}\"`);

// 	let data = await fetch("https://nextchessmove.com/api/v4/calculate", {
// 		"headers": {
// 				"accept": "*/*",
// 				"accept-language": "en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7",
// 				"content-type": "application/json",
// 				"sec-fetch-dest": "empty",
// 				"sec-fetch-mode": "cors",
// 				"sec-fetch-site": "same-origin",
// 		},
// 		"referrer": "https://nextchessmove.com/",
// 		"referrerPolicy": "strict-origin-when-cross-origin",
// 		"body": JSON.stringify( {
// 			"kind":"remote",
// 			"fen": fen,
// 			"position":{
// 				"fen": fen,
// 				"moves": []
// 			},
// 			"movetime": 5,
// 			"multipv": 1,
// 			"hardware": {
// 				"usePaidCpu": true,
// 				"usePaidGpu": true
// 			},
// 			"engine": "sf11",
// 			"syzygy": false,
// 			"uuid": uuid.v4()
// 		}),
// 		"method": "POST",
// 		"mode": "cors",
// 		"credentials": "include"
// 	});

// 	let move_result = await data.json();
	
// 	let move = move_result.move;
// 	move = {
// 		"from": move.substr(0, 2),
// 		"to": move.substr(2, 4),
// 	};

// 	cache[fen] = move;

// 	console.log(`[+] resolved \"${fen}\" to ${move_result.move}`);

// 	return move;
// }

wss.on("connection", (socket) => {
	socket.on("message", async (message) => {
		let m = JSON.parse(message);

		if(m.type == "move") {
			socket.send(JSON.stringify({
				"type": "status",
				"msg": "getting next move",
				"color": color_yellow
			}));

			try {
				let next_move = await get_best_move(m.fen);

				socket.send(JSON.stringify({
					"type": "status",
					"msg": `best move is ${next_move.from} -> ${next_move.to}`,
					"color": color_green
				}));

				socket.send(JSON.stringify({
					"type": "move",
					"move": next_move
				}));
			} catch(e) {
				socket.send(JSON.stringify({
					"type": "status",
					"msg": `error: ${e}`,
					"color": color_red
				}));
			}
		}
	});

	socket.send(JSON.stringify({
		"type": "status",
		"msg": "connected to chessbot servers",
		"color": color_green
	}));
});

server.on("upgrade", (request, socket, head) => {
	wss.handleUpgrade(request, socket, head, (w) => {
		wss.emit("connection", w, request);
	});
});

app.get("/modded_js", async (req, res) => {
	res.type("application/javascript");
	res.send(chess_js);
});

server.listen(4321, async () => {
	console.log(`[+] chessbot server started, getting and patching chess.com js`);

	let our_client = fs.readFileSync("client.js", "utf8");

	let chess_com_js = await fetch(chess_com_js_url);
	chess_com_js = await chess_com_js.text();

	chess_js = "\n// chessbot 1.0.0\n";
	chess_js += our_client;
	chess_js += `\n// ${chess_com_js_url}\n`;
	chess_js += chess_com_js.replace("positionChanged(){", "positionChanged(){window.chessbot_on_move(this);");

	console.log(`[+] js patched, chessbot fully ready`);
});