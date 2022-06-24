export const API_KEY = 'f665635fa7d9a395248a4a58c773eaa7a6bf25fc9586dc97a67f0a2fbd1e1ffb';
let subscribedTikers = new Map();

function sendToWB(message){
    message = JSON.stringify(message);
    if (socket.readyState === '1') {
        socket.send(message);
        return;
    }
    socket.addEventListener('open', () => {socket.send(message)}, {once: true});
}
function subscribeToWB(ticker){
    let message = {
        "action": "SubAdd",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    }
    sendToWB(message);
    
    
}
function unsubscribeToWB(ticker){
    let message = {
        "action": "SubRemove",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    }
    sendToWB(message);
}
export let subscribeToUpdate = (tickerName, cb) => {
    subscribedTikers.set(tickerName, cb);
    subscribeToWB(tickerName);
}
export let unsubscribeToUpdate = (tickerName) => {
    if (subscribedTikers.get(tickerName)) subscribedTikers.delete(tickerName);
    unsubscribeToWB(tickerName);
}

setTimeout(() => {
    if (subscribedTikers.size != 0){
        fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${Object.keys(Object.fromEntries(subscribedTikers.entries())).join(',')}&tsyms=USD&api-key=${API_KEY}`).then(data => data.json()).then( d => Object.keys(d).forEach( el => {
            let updateTicker = subscribedTikers.get(el);
            updateTicker(d[el].USD);
        }));
    }
} , 3000)


const bc = new BroadcastChannel('test');
console.log(bc)
function connectToBC(){
    bc.addEventListener('message', e => {
        let {currentTicker: currentTicker, price: price} = e.data;
        let updateTicker = subscribedTikers.get(currentTicker);
        updateTicker(price);
    })
}

const AGGREGATE_SYMBOL = '5';
const FLAGS = 4;

let socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
socket.addEventListener('open', () => {
     console.log('We have connected successfully');
    });
socket.onmessage = (e) => {
    //console.log(e);
    let {TYPE: type, FROMSYMBOL: currentTicker, PRICE: price, FLAGS: flags} = JSON.parse(e.data);
    if (type != AGGREGATE_SYMBOL || flags === FLAGS) return;
    bc.postMessage({price, currentTicker});
    let updateTicker = subscribedTikers.get(currentTicker);
    updateTicker(price);
}

socket.onclose = event => {
    if (event.wasClean) {
        console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
    } else {
        console.log('[close] Соединение прервано');
        connectToBC();
    }
  };
socket.onerror = error => {
    console.log(`[error] ${error.message}`);
  };

            
 
