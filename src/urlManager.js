let filters = [];
export function setUrl(f) {
    filters = Object.fromEntries(f);
    window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${filters['filter']}&page=${filters.page}`
      );
}
export function getUrl() {
    let windowData = Object.fromEntries(
        new URL(window.location).searchParams.entries()
      );
      const VALID_KEYS = ["filter", "page"];   
      let filters = {};
      VALID_KEYS.forEach((key) => {
        if (windowData[key]) filters[key] = windowData[key];
      });
      return filters;
    }