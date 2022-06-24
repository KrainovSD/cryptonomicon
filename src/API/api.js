export const API_KEY = 'f665635fa7d9a395248a4a58c773eaa7a6bf25fc9586dc97a67f0a2fbd1e1ffb';
let subscribedTikers = new Map();
function sendToWB(message){
    message = JSON.stringify(message);
    if (socket.readyState === 1) {
        socket.send(message);
        return;
    }
    socket.addEventListener('open', () => {socket.send(message)}, {once: true});
}
function subscribeToWB(ticker, currency='USD'){
    let message = {
        "action": "SubAdd",
        "subs": [`5~CCCAGG~${ticker}~${currency}`]
    }
    sendToWB(message);
    
    
}
function resubscribeToAnotherCurrency(e){
    if (!JSON.parse(e.data).PARAMETER) return;
    console.log(JSON.parse(e.data).PARAMETER)
    let currentTicker = JSON.parse(e.data).PARAMETER.split('~')[2];
    let currency = JSON.parse(e.data).PARAMETER.split(`~`)[3];
    if (currency == 'BTC') {
        console.log('НУ СУКА НИКАК')
        let updateTicker = subscribedTikers.get(currentTicker);
        updateTicker(currency);
        return;
    }

    subscribeToWB(currentTicker, 'BTC');
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
    if (tickerName === 'BTC') return;
    subscribeToWB(tickerName);
}
export let unsubscribeToUpdate = (tickerName) => {
    if (subscribedTikers.get(tickerName)) subscribedTikers.delete(tickerName);
    if (tickerName === 'BTC') return;
    unsubscribeToWB(tickerName);
}
function sendPrice(price, currentTicker, currency){
    if (currency === 'BTC') price = price * priceBTC;
    bc.postMessage({price, currentTicker});
    let updateTicker = subscribedTikers.get(currentTicker);
    updateTicker(price);
}



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
const MESSAGETYPE = '500'
const FLAGS = 4;

let socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
socket.addEventListener('open', () => {
     console.log('We have connected successfully');
    });
socket.onmessage = (e) => {
    let {TYPE: type, FROMSYMBOL: currentTicker, TOSYMBOL: currency, PRICE: price, FLAGS: flags} = JSON.parse(e.data);
    if (currentTicker !== 'BTC') console.log(e);
    if (type == MESSAGETYPE) {
        resubscribeToAnotherCurrency(e);
        return;
    }
    if (type != AGGREGATE_SYMBOL || flags === FLAGS) return;
    if (subscribedTikers.has(currentTicker)) {
        sendPrice(price, currentTicker, currency);
    }
    if (currentTicker === 'BTC') priceBTC = price;
    
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

 
let priceBTC;
subscribeToWB('BTC');



