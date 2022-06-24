export function setStorage(card){
    localStorage.setItem("card", JSON.stringify(card));
}
export function getStorage(){
    if (localStorage.getItem("card")) {
        let card = JSON.parse(localStorage.getItem("card"));
        card.map((i) => (i.price = "-"));
        return card;
      }
}