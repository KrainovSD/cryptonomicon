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
      />
      <div class="addButton" @click="addCard">
        <img src="../public/image/plus.png" class="addButton__img" alt="" />
        <p class="addButton__caption">Добавить</p>
      </div>
    </div>
    <div class="viewField" v-if="card.length > 0">
      <div
        class="viewCard"
        v-for="(key, index) in card"
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
    };
  },

  methods: {
    addCard() {
      const newTicker = { name: this.ticker, price: "-" };
      this.card.push(newTicker);
      this.ticker = "";

      setInterval(async () => {
        const f = await fetch(
          `https://min-api.cryptocompare.com/data/price?fsym=${newTicker.name}&tsyms=USD&api-key=4f4fc1a98c2ab56170cf7eba355106ec116a599e96a2629f19c933ea1c2c9f3d`
        );
        const data = await f.json();
        console.log(`${newTicker.name} = ${data.USD}`);
        this.card.find((t) => t.name === newTicker.name).price =
          data.USD > 1 ? data.USD.toFixed(2) : data.USD.toPrecision(2);
        if (this.graph?.name === newTicker.name) {
          this.bar.push(data.USD);
        }
      }, 3000);
    },
    delCard(id) {
      if (this.graph == this.card[id]) this.delGraph();
      this.card.splice(id, 1);
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
  },
};
</script>

<style src="../public/css/style.css"></style>
