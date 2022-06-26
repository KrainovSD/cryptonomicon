

export function setStorage(card){
    let cards = [];
    card.forEach(e => {
        cards.push({name: e.name, price: e.price})
    });
    localStorage.setItem("card", JSON.stringify(cards));
}
export function getStorage(){
    if (localStorage.getItem("card")) {
        let card = JSON.parse(localStorage.getItem("card"));
        card.map((i) => (i.price = "-"));
        return card;
    }
    return [];
}