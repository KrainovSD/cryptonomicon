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
        @input="errorMassage = ''"
      />

      <div v-if="comparedTiker.length > 0" class="addTool__hint">
        <template v-for="(key, indx) in comparedTiker" :key="indx">
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
        v-for="(key, index) in paginatedCard"
        :key="index"
        @click="selGraph = key"
        :class="{
          viewCard_active: key == selGraph,
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
    <div class="viewGraph" v-if="selGraph">
      <div class="viewGraph__header">
        <p>{{ selGraph.name }} - USD</p>
        <img src="../public/image/cancel.png" alt="" @click="selGraph = null" />
      </div>
      <div class="viewGraph__graph">
        <div
          v-for="(hg, idx) in normalizedBar"
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
      filter: "",
      page: 1,
      errorMassage: "",
      card: [],
      selGraph: null,
      bar: [],
      properlyList: [],
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

  computed: {
    comparedTiker() {
      if (this.ticker === "") {
        return false;
      }
      return Object.keys(this.properlyList).filter((f) =>
        this.properlyList[f].Symbol.toLowerCase().includes(
          this.ticker.toLowerCase()
        )
      );
    },
    /* where do i should store constants like this?? */
    cardOnPage() {
      return 6;
    },
    startIndexPage() {
      return (this.page - 1) * this.cardOnPage; // [0,5][6,11][12,17]
    },
    endIndexPage() {
      return this.page * this.cardOnPage - 1;
    },
    filteredCard() {
      return this.card.filter((f) =>
        f.name.toLowerCase().includes(this.filter.toLowerCase())
      );
    },
    paginatedCard() {
      return this.filteredCard.slice(
        this.startIndexPage,
        this.endIndexPage + 1
      );
    },
    hasNextPage() {
      return this.filteredCard.length > this.page * 6;
    },
    normalizedBar() {
      const maxP = Math.max(...this.bar);
      const minP = Math.min(...this.bar);
      if (maxP - minP == 0) return this.bar.map(() => 50);
      return this.bar.map(
        (price) => 5 + ((price - minP) * 100) / (maxP - minP)
      );
    },
  },

  methods: {
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
      this.card = [...this.card, newTicker];
      this.updateCard(newTicker.name);
      this.ticker = "";
    },
    delCard(id) {
      if (this.selGraph == this.card[id]) this.selGraph = null;
      clearInterval(this.card[id].idInteval);
      this.card.splice(id, 1);
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
        if (this.selGraph?.name === tickerName) {
          this.bar.push(data.USD);
        }
      }, 300000);
      this.card.find((t) => t.name === tickerName).idInteval = x;
    },
  },
  watch: {
    card() {
      localStorage.setItem("card", JSON.stringify(this.card));
    },
    paginatedCard() {
      if (this.paginatedCard === 0 && this.page > 1) this.page--;
    },
    selGraph() {
      this.bar = [];
    },
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
