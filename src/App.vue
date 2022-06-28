<template>
  <div class="workplace">
    <div class="addTool">
      <h2 class="addTool__header">Тикер</h2>
      <input
        type="text"
        class="addTool__input"
        placeholder="write the name"
        v-model="ticker"
        @keydown.enter="validationTicker"
        @input="errorMassage = ''"
      />

      <div v-if="comparedTiker.length > 0" class="addTool__hint">
        <template v-for="(key, indx) in comparedTiker" :key="indx">
          <div
            @click="
              ticker = key;
              validationTicker();
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
      <div class="addButton" @click="validationTicker">
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
          'bg-red': key.work == false,
        }"
      >
        <p class="viewCard__header">{{ key.name }} - USD</p>
        <p class="viewCard__info">{{ key.price }}</p>
        <div
          class="deleteButton"
          @click.stop="delCard(key.name)"
          :data-id="index"
        >
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
      <div class="viewGraph__graph" ref="selGraph">
        <div
          v-for="(hg, idx) in normalizedBar"
          :key="idx"
          :style="`height: ${hg}%`"
          ref="bar"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { subscribeToUpdate, unsubscribeToUpdate } from "./API/api_bd";
import { getUrl, setUrl } from "./urlManager";
import { getStorage, setStorage } from "./persistentStorage";

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
    let ulrProperties = getUrl();
    Object.keys(ulrProperties).forEach((el) => {
      this[el] = ulrProperties[el];
    });
    window.addEventListener("popstate", () => {
      let ulrProperties = getUrl();
      Object.keys(ulrProperties).forEach((el) => {
        this[el] = ulrProperties[el];
      });
    });
    window.addEventListener("storage", this.checkStorageChanges);

    (async function (t) {
      let f = await fetch(
        "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
      );
      let data = await f.json();
      t.properlyList = data.Data;
    })(this);

    this.card = getStorage();
    this.card.forEach((el) =>
      subscribeToUpdate(el.name, (newPrice) =>
        this.updateCard(el.name, newPrice)
      )
    );
  },
  mounted() {
    window.addEventListener("resize", this.correctionBarItem);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.correctionBarItem);
    window.removeEventListener("storage", this.checkStorageChanges);
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
    filters() {
      return [
        ["filter", this.filter],
        ["page", this.page],
      ];
    },
  },

  methods: {
    validationTicker() {
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
      this.addCard(this.ticker);
      this.ticker = "";
    },
    addCard(currentTicker) {
      const newTicker = { name: currentTicker.toUpperCase(), price: "-" };
      this.card = [...this.card, newTicker];
      subscribeToUpdate(newTicker.name, (newPrice) =>
        this.updateCard(newTicker.name, newPrice)
      );
    },
    delCard(tickerName) {
      if (this.selGraph?.name == tickerName) this.selGraph = null;
      unsubscribeToUpdate(tickerName);
      this.card = this.card.filter((el) => el.name !== tickerName);
    },
    updateCard(tickerName, newPrice) {
      if (typeof newPrice !== "number") {
        this.card.find((el) => el.name == tickerName)["work"] = false;
        return;
      }
      if (this.selGraph?.name == tickerName) {
        this.bar = [...this.bar, newPrice];
      }
      this.card.find((el) => el.name == tickerName).price =
        newPrice > 1 ? newPrice.toFixed(2) : newPrice.toPrecision(2);
      this.card.find((el) => el.name == tickerName)["work"] = true;
    },
    correctionBarItem() {
      if (this.$refs.selGraph) {
        if (this.bar.length > this.calculatedMaxItemBar()) {
          let extra = this.bar.length - this.calculatedMaxItemBar();
          this.bar.splice(0, extra);
        }
      }
    },
    calculatedMaxItemBar() {
      let barWidth = 31;
      this.$refs.bar?.length > 0
        ? (barWidth = this.$refs.bar[0].clientWidth + 2)
        : (barWidth = 31);
      let selGraphWidth = this.$refs.selGraph.clientWidth;
      return Math.floor(selGraphWidth / barWidth);
    },
    checkStorageChanges() {
      let newCards = getStorage();
      let difference = this.card.filter(
        ({ name: id1 }) => !newCards.some(({ name: id2 }) => id2 === id1)
      );
      if (difference.length == 1) {
        this.delCard(difference[0].name);
        return;
      }
      difference = newCards.filter(
        ({ name: id1 }) => !this.card.some(({ name: id2 }) => id2 === id1)
      );
      if (difference.length == 1) {
        this.addCard(difference[0].name);
        return;
      }
    },
  },
  watch: {
    card() {
      setStorage(this.card);
    },
    paginatedCard() {
      if (this.paginatedCard.length === 0 && this.page > 1) this.page--;
    },
    selGraph() {
      this.bar = [];
    },
    filters() {
      setUrl(this.filters);
    },
    bar() {
      this.$nextTick().then(this.correctionBarItem);
    },
  },
};
</script>

<style src="../public/css/style.css"></style>
