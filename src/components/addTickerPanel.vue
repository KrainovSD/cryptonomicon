<template>
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
            errorMassage = '';
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
    <div
      class="addButton"
      @click.stop="validationTicker"
      disabled="disabledAddButton"
    >
      <img src="../../public/image/plus.png" class="addButton__img" alt="" />
      <p class="addButton__caption">Добавить</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "addTickerPanel",

  props: {
    cardList: {
      type: Array,
      require: true,
    },
  },

  emits: {
    "send-ticker": null,
  },

  data() {
    return {
      ticker: "",
      errorMassage: "",
      properlyList: [],
    };
  },

  created() {
    (async function (t) {
      let f = await fetch(
        "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
      );
      let data = await f.json();
      t.properlyList = data.Data;
    })(this);
    console.log(this.cardList);
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
    disabledAddButton() {
      return this.cardList.length <= 2;
    },
  },

  methods: {
    validationTicker() {
      let pattern = new RegExp(`^${this.ticker.toLowerCase()}$`);
      /*
        check for exist ticker
      */
      if (this.ticker.trim() === "") {
        this.errorMassage = "Поле тикера пустое";
        return;
      }

      if (
        !Object.keys(this.properlyList).find(
          (f) =>
            this.properlyList[f].Symbol.toLowerCase() ===
            this.ticker.toLowerCase()
        )
      ) {
        this.errorMassage = "Выбранный вами тикер не существует";
        return false;
      }
      /*
        check for ticker is added
      */
      for (let key in this.cardList) {
        if (pattern.test(this.cardList[key].name.toLowerCase())) {
          this.errorMassage = "Выбранный тикер уже добавлен";
          return false;
        }
      }
      this.$emit("send-ticker", this.ticker);
      this.ticker = "";
    },
  },
};
</script>
