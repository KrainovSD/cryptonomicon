<template>
  <div class="workplace">
    <add-ticker-panel @send-ticker="addCard" :cardList="card" />
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
    <tickers-graph
      @delete-graph="selGraph = null"
      :selGraph="selGraph"
      :barItem="barItem"
    />
  </div>
</template>

<script>
import { subscribeToUpdate, unsubscribeToUpdate } from "./API/api_bd";
import { getUrl, setUrl } from "./urlManager";
import { getStorage, setStorage } from "./persistentStorage";
import addTickerPanel from "./components/addTickerPanel.vue";
import tickersGraph from "./components/tickersGraph.vue";

export default {
  name: "App",
  components: {
    addTickerPanel,
    tickersGraph,
  },

  data() {
    return {
      filter: "",
      page: 1,
      card: [],
      selGraph: null,
      barItem: 0,
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

    this.card = getStorage();
    this.card.forEach((el) =>
      subscribeToUpdate(el.name, (newPrice) =>
        this.updateCard(el.name, newPrice)
      )
    );
  },
  beforeUnmount() {
    window.removeEventListener("storage", this.checkStorageChanges);
  },

  computed: {
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
    filters() {
      return [
        ["filter", this.filter],
        ["page", this.page],
      ];
    },
  },

  methods: {
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
        this.barItem = newPrice;
      }
      this.card.find((el) => el.name == tickerName).price =
        newPrice > 1 ? newPrice.toFixed(2) : newPrice.toPrecision(2);
      this.card.find((el) => el.name == tickerName)["work"] = true;
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
    filters() {
      setUrl(this.filters);
    },
  },
};
</script>

<style src="../public/css/style.css"></style>
