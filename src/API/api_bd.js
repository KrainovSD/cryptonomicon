function generate_token(length){
    //edit the token allowed characters
    let a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    let b = [];  
    for (let i=0; i<length; i++) {
        let j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}
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
export let subscribeToUpdate = (tickerName, cb) => {
    subscribedTikers.set(tickerName, cb);
    if (tickerName === 'BTC' || !sessionStorage.getItem('mainTab')) return;
    subscribeToWB(tickerName);
}
export let unsubscribeToUpdate = (tickerName) => {
    if (subscribedTikers.get(tickerName)) subscribedTikers.delete(tickerName);
    if (tickerName === 'BTC' || !sessionStorage.getItem('mainTab')) return;
    unsubscribeToWB(tickerName);
}
function sendPrice(price, currentTicker, currency){
    if (currency === 'BTC' && price) price = price * priceBTC;
    bc.postMessage({type: 1, price: price, currentTicker: currentTicker});
    let updateTicker = subscribedTikers.get(currentTicker);
    updateTicker(price);
}
const bc = new BroadcastChannel('test');
bc.addEventListener('message', e => {
    // 1 - update price,  4 - reconetectingToWEB, 5 - assign new lead;
    let {type: typeMessage, currentTicker: currentTicker, price: price, tabID: newMainTab} = e.data;
    console.log(e.data)
    switch (typeMessage){
        case 1: {
            let updateTicker = subscribedTikers.get(currentTicker);
            updateTicker(price);
            break; 
        }
        case 4: {
            console.log('Main tab is reconecting to WB');
            break;
        }
        case 5: {
            console.log('Main tab was changed');
            if (newMainTab === tabID) connectToWeb();
            break;  
        } 
    }
})







export const API_KEY = 'f665635fa7d9a395248a4a58c773eaa7a6bf25fc9586dc97a67f0a2fbd1e1ffb';
let subscribedTikers = new Map();
let socket;
let priceBTC;
const AGGREGATE_SYMBOL = '5';
const MESSAGETYPE = '500'
const FLAGS = 4;

const tabID = generate_token(10); 
if (localStorage.getItem('tabsID')){
    let tabsID = JSON.parse(localStorage.getItem('tabsID'));
    tabsID.push(tabID);
    localStorage.setItem('tabsID', JSON.stringify(tabsID));
}
else {
    localStorage.setItem('tabsID', JSON.stringify([tabID]));
    connectToWeb();
}



function connectToWeb(){
    

    sessionStorage.setItem('mainTab', true);
    socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
    console.log(subscribedTikers.keys())
    if (!(subscribedTikers == 0)){
        for(let key of subscribedTikers.keys()){
            subscribeToWB(key);
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
            setTimeout(() => {
                bc.postMessage({type: 4});
                connectToWeb();
            }, 5000);
        }
        
    };
    socket.onerror = error => {
        console.log(`[error] ${error.message}`);
    };

    subscribeToWB('BTC');
}

window.addEventListener('unload', ()=>{
    let tabsID = JSON.parse(localStorage.getItem('tabsID'));
    if (tabsID.length === 1) {
        localStorage.removeItem('tabsID');
        return;
    }
    tabsID = tabsID.filter(e => e != tabID);
    localStorage.setItem('tabsID', JSON.stringify(tabsID));
    if (sessionStorage.getItem('mainTab')) bc.postMessage({type: 5, tabID: tabsID[0]});

})





