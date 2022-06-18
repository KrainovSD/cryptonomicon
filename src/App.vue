<template>
  <div class="workplace">
    <div class="addTool">
      <h2 class="addTool__header">Тикер</h2>
      <input
        type="text"
        class="addTool__input"
        placeholder="write the name"
        v-model="ticker"
        @keydown.enter="addCard"
        @input="checkHint"
      />

      <div v-if="compare.length > 0" class="addTool__hint">
        <template v-for="(key, indx) in compare" :key="indx">
          <div
            @click="
              ticker = key;
              addCard();
            "
            v-if="indx < 4"
          >
            {{ key }}
          </div>
        </template>
      </div>
      <p v-if="errorMassage != ''" class="addTool__errorText">
        {{ errorMassage }}
      </p>
      <div class="addButton" @click="addCard">
        <img src="../public/image/plus.png" class="addButton__img" alt="" />
        <p class="addButton__caption">Добавить</p>
      </div>
    </div>
    <div class="filterTool">
      <p class="filterTool__filterCaption">Фильтр:</p>
      <input
        v-model="filter"
        @input="page = 1"
        type="text"
        class="filterTool__input"
        placeholder="filter"
      />
      <div
        :class="
          page > 1 ? 'filterTool__buttonDown' : 'filterTool__buttonDown_disable'
        "
        @click="page--"
      >
        Назад
      </div>
      <p class="filterTool__pageCaption">{{ page }}</p>
      <div
        :class="
          hasNextPage ? 'filterTool__buttonUp' : 'filterTool__buttonUp_disable'
        "
        @click="page++"
      >
        Вперед
      </div>
    </div>
    <div class="viewField" v-if="card.length > 0">
      <div
        class="viewCard"
        v-for="(key, index) in filterCard()"
        :key="index"
        @click="selectGraph(key)"
        :class="{
          viewCard_active: key == graph,
        }"
      >
        <p class="viewCard__header">{{ key.name }} - USD</p>
        <p class="viewCard__info">{{ key.price }}</p>
        <div class="deleteButton" @click.stop="delCard(index)" :data-id="index">
          <img
            src="../public/image/basket.png"
            alt=""
            class="deleteButton__img"
          />
          <p class="deleteButton__caption">Удалить</p>
        </div>
      </div>
    </div>
    <div class="viewGraph" v-if="graph">
      <div class="viewGraph__header">
        <p>{{ graph.name }} - USD</p>
        <img src="../public/image/cancel.png" alt="" @click="delGraph" />
      </div>
      <div class="viewGraph__graph">
        <div
          v-for="(hg, idx) in normalBar()"
          :key="idx"
          :style="`height: ${hg}%`"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",

  data() {
    return {
      ticker: "",
      card: [],
      graph: null,
      bar: [],
      properlyList: [],
      errorMassage: "",
      compare: [],
      filter: "",
      page: 1,
      hasNextPage: true,
    };
  },

  created() {
    let windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );
    if (windowData.filter) this.filter = windowData.filter;
    if (windowData.page) this.page = windowData.page;

    (async function (a) {
      let f = await fetch(
        "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
      );
      let data = await f.json();
      a.properlyList = data.Data;
    })(this);

    if (localStorage.getItem("card")) {
      this.card = JSON.parse(localStorage.getItem("card"));
      this.card.forEach((el) => {
        this.updateCard(el.name);
      });
    }
  },

  methods: {
    checkHint() {
      this.compare = [];
      this.errorMassage = "";
      if (this.ticker === "") {
        return false;
      }
      this.compare = Object.keys(this.properlyList).filter((f) =>
        this.properlyList[f].Symbol.toLowerCase().includes(
          this.ticker.toLowerCase()
        )
      );
    },
    filterCard() {
      let cardOnPage = 6;
      let startPage = (this.page - 1) * cardOnPage; // [0,5][6,11][12,17]
      let filteredCard = this.card.filter((f) =>
        f.name.toLowerCase().includes(this.filter.toLowerCase())
      );
      this.hasNextPage = filteredCard.length > this.page * 6;
      return filteredCard.splice(startPage, cardOnPage);
    },
    addCard() {
      let pattern = new RegExp(`^${this.ticker.toLowerCase()}$`);
      /* 
        check for exist ticker
      */
      if (
        !Object.keys(this.properlyList).find((f) =>
          this.properlyList[f].Symbol.toLowerCase().includes(
            this.ticker.toLowerCase()
          )
        )
      ) {
        this.errorMassage = "Выбранный вами тикер не существует";
        return false;
      }
      /* 
        check for ticker is added
      */
      for (let key in this.card) {
        if (pattern.test(this.card[key].name.toLowerCase())) {
          this.errorMassage = "Выбранный тикер уже добавлен";
          return false;
        }
      }
      /* main logic */
      const newTicker = { name: this.ticker.toUpperCase(), price: "-" };
      this.card.push(newTicker);
      this.updateCard(newTicker.name);
      this.ticker = "";
      this.compare = [];
      localStorage.setItem("card", JSON.stringify(this.card));
    },
    delCard(id) {
      if (this.graph == this.card[id]) this.delGraph();
      clearInterval(this.card[id].idInteval);
      this.card.splice(id, 1);
      localStorage.setItem("card", JSON.stringify(this.card));
    },
    delGraph() {
      this.graph = null;
      this.bar = [];
    },
    selectGraph(ticker) {
      this.graph = ticker;
      this.bar = [];
    },
    normalBar() {
      const maxP = Math.max(...this.bar);
      const minP = Math.min(...this.bar);
      return this.bar.map((price) => {
        let data = 5 + ((price - minP) * 100) / (maxP - minP);
        if (isNaN(data)) data = 5;
        return data;
      });
    },
    updateCard(tickerName) {
      let x = setInterval(async () => {
        const f = await fetch(
          `https://min-api.cryptocompare.com/data/price?fsym=${tickerName}&tsyms=USD&api-key=4f4fc1a98c2ab56170cf7eba355106ec116a599e96a2629f19c933ea1c2c9f3d`
        );
        const data = await f.json();
        console.log(`${tickerName} = ${data.USD}`);
        this.card.find((t) => t.name === tickerName).price =
          data.USD > 1 ? data.USD.toFixed(2) : data.USD.toPrecision(2);
        if (this.graph?.name === tickerName) {
          this.bar.push(data.USD);
        }
      }, 300000);
      this.card.find((t) => t.name === tickerName).idInteval = x;
    },
  },
  watch: {
    filter() {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${this.filter}&page=${this.page}`
      );
    },
    page() {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${this.filter}&page=${this.page}`
      );
    },
  },
};
</script>

<style src="../public/css/style.css"></style>
