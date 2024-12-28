<script setup>
import GpuMonitor from './components/GpuMonitor.vue';
import servers from "./servers.json";

let urls = [];
let titles = [];
for (let i = 0; i < servers.length; i++) {
  urls.push(servers[i].url);
  titles.push(servers[i].title);
}
const data_length = 100; // GPU利用率历史数据长度，用于绘制折线图（先画个饼）
const sleep_time = 500;  // 间隔多久刷新一次数据，单位毫秒
</script>

<template>
  <h3><a href="https://www.do1e.cn/posts/citelab/server-help">服务器使用说明</a></h3>
  <GpuMonitor v-for="(url, index) in urls" :key="index" :url="url" :title="titles[index]" :data_length="data_length" :sleep_time="sleep_time" />
</template>

<style scoped>
body {
  margin-left: 20px;
  margin-right: 20px;
}
</style>
