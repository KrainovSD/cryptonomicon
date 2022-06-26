
export let subscribeToUpdate = (tickerName, cb) => {
    subscribedTikers.set(tickerName, cb);
    myWorker.port.postMessage({type: 1, tickerName: tickerName});
    //subscribeToWB(tickerName);
}
export let unsubscribeToUpdate = (tickerName) => {
    if (subscribedTikers.get(tickerName)) subscribedTikers.delete(tickerName);
    myWorker.port.postMessage({type: 2, tickerName: tickerName});
    //unsubscribeToWB(tickerName);
}
let subscribedTikers = new Map();

let myWorker = new SharedWorker("shared_worker.js");
myWorker.port.onmessage = function(e){
    let {currentTicker: currentTicker, price: price} = e.data;
    console.log(e.data)
    let updateTicker = subscribedTikers.get(currentTicker);
    updateTicker(price);
}


