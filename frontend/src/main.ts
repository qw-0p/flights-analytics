import { createApp } from "vue";
import naive from "naive-ui";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Dashboard from "./views/Dashboard.vue";
import "./echarts";

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", component: Dashboard }],
});

createApp(App).use(naive).use(router).mount("#app");
