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
    if (!(JSON.parse(e.data).MESSAGE == 'INVALID_SUB')) return;
    let currentTicker = JSON.parse(e.data).PARAMETER.split('~')[2];
    let currency = JSON.parse(e.data).PARAMETER.split(`~`)[3];
    if (currency == 'BTC') {
        sendPrice(false, currentTicker, currency)
        return;
    }
    unsubscribeToWB(currentTicker, 'BTC');
    subscribeToWB(currentTicker, 'BTC');
} 
function unsubscribeToWB(ticker, currency='USD'){
    let message = {
        "action": "SubRemove",
        "subs": [`5~CCCAGG~${ticker}~${currency}`]
    }
    sendToWB(message);
}
function sendPrice(price, currentTicker, currency){
    if (currency === 'BTC' && price) price = price * priceBTC;
    if (subscribedTikers.includes(currentTicker)) port.postMessage({price: price, currentTicker: currentTicker});
}

let subscribedTikers = [];
let socket;
let priceBTC;
let port;
self.onconnect = function(e){
    port = e.port[0];
    connectToWeb();
    port.onmessage = function(e){
        console.log(e.data)
        let {type: typeMessage, tickerName: currentTicker} = e.data;
        switch (typeMessage){
            case 1:
                if (subscribedTikers.includes(currentTicker)) break;
                subscribedTikers.push(currentTicker);
                subscribeToWB(currentTicker);
                break;
            case 2:
                if (!subscribedTikers.includes(currentTicker)) break;
                subscribedTikers = subscribedTikers.filter(e => e != currentTicker);
                unsubscribeToWB(currentTicker);
                break;
        }
    }
}

function connectToWeb(){
    const API_KEY = 'f665635fa7d9a395248a4a58c773eaa7a6bf25fc9586dc97a67f0a2fbd1e1ffb';
    const AGGREGATE_SYMBOL = '5';
    const MESSAGETYPE = '500'
    const FLAGS = 4;

    socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
    console.log(subscribedTikers.keys())
    if (!(subscribedTikers.length == 0)){
        for(let value of subscribedTikers){
            subscribeToWB(value);
        }
    }
    socket.addEventListener('open', () => {
        console.log('We have connected successfully');
        });
    socket.onmessage = (e) => {
        let {TYPE: type, FROMSYMBOL: currentTicker, TOSYMBOL: currency, PRICE: price, FLAGS: flags} = JSON.parse(e.data);
        //if (currentTicker !== 'BTC') console.log(e);
        if (type == MESSAGETYPE) {
            resubscribeToAnotherCurrency(e);
            return;
        }
        if (type != AGGREGATE_SYMBOL || flags === FLAGS) return;
        if (subscribedTikers.includes(currentTicker)) {
            sendPrice(price, currentTicker, currency);
        }
        if (currentTicker === 'BTC') priceBTC = price;
    }

    socket.onclose = event => {
        if (event.wasClean) {
            console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
        } else {
            console.log('[close] Соединение прервано');
            setTimeout(() => {
                connectToWeb();
            }, 5000);
        }
        
    };
    socket.onerror = error => {
        console.log(`[error] ${error.message}`);
    };

    subscribeToWB('BTC');
}