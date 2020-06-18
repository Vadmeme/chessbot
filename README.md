# chessbot
a bot to show you the best move for chess.com games

# installation
1. download this repo
2. edit the `client.js` file with a updated server websocket url
3. run the server (`node index.js`)
4. use some chrome extension (i use [Resource Override](https://chrome.google.com/webstore/detail/resource-override/pkoacgokdfckfpndoffpifphamojphii?hl=en)) to replace `https://betacssjs.chesscomfiles.com/bundles/live/beta/live.client.*.js` to `http://<your server>/modded_js`;

# hosting
for now i have my own version hosted on `https://swat.rip:4321/modded_js`, dont count on this being up 24/7 however
