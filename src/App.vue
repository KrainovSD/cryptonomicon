<template>
  <div class="workplace">
    <div class="addTool">
      <h2 class="addTool__header">Тикер</h2>
      <input
        type="text"
        class="addTool__input"
        placeholder="write the name"
        v-model="ticker"
        @keydown.enter="add"
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
        @click="graph = key"
      >
        <p class="viewCard__header">{{ key.name }} - USD</p>
        <p class="viewCard__info">{{ key.price }}</p>
        <div class="deleteButton" @click="delCard(index)" :data-id="index">
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
        <p>VUE - USD</p>
        <img src="../public/image/cancel.png" alt="" @click="delGraph" />
      </div>
      <div class="viewGraph__graph">
        <div style="height: 20%"></div>
        <div style="height: 40%"></div>
        <div style="height: 60%"></div>
        <div style="height: 20%"></div>
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
      card: [
        { name: "BTC", price: 234.32 },
        { name: "UTF", price: 94394.34 },
        { name: "WRD", price: 43.34 },
      ],
      graph: null,
    };
  },

  methods: {
    addCard() {
      const newTicker = { name: "DOG", price: 234.23 };
      this.card.push(newTicker);
      this.ticker = "";
    },
    delCard(id) {
      this.card.splice(id, 1);
    },
    delGraph() {
      this.graph = null;
    },
  },
};
</script>

<style src="../public/css/style.css"></style>
