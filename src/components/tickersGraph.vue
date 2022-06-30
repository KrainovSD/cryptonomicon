<template>
  <div class="viewGraph" v-if="selGraph">
    <div class="viewGraph__header">
      <p>{{ selGraph.name }} - USD</p>
      <img
        src="../../public/image/cancel.png"
        alt=""
        @click="this.$emit('delete-graph')"
      />
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
</template>

<script>
export default {
  props: {
    selGraph: {
      type: Object,
      required: false,
    },
    barItem: {
      type: Number,
      required: false,
    },
  },
  emits: {
    "delete-graph": null,
  },

  data() {
    return {
      bar: [],
    };
  },
  mounted() {
    window.addEventListener("resize", this.correctionBarItem);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.correctionBarItem);
  },

  computed: {
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
  },

  watch: {
    barItem() {
      this.bar = [...this.bar, this.barItem];
    },
    bar() {
      this.$nextTick().then(this.correctionBarItem);
    },
    selGraph() {
      this.bar = [];
    },
  },
};
</script>
