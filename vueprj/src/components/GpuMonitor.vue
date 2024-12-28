<template>
  <div>
    <h1>{{ title }}</h1>
    <article class="markdown-body">
      <div v-for="device in data.data.devices" :key="device.idx">
        <b>GPU{{ device.idx }}: </b>
        <b>显存： </b>
        <div class="g-container">
          <div class="g-progress" :style="{ width: device.memory_utilization + '%' }"></div>
        </div>
        <code style="width: 25ch;">{{ device.memory_used_human }}/{{ device.memory_total_human }} {{ device.memory_utilization }}%</code>
        <b>利用率： </b>
        <div class="g-container">
          <div class="g-progress" :style="{ width: device.gpu_utilization + '%' }"></div>
        </div>
        <code style="width: 5ch;">{{ device.gpu_utilization }}%</code>
        <b>温度： </b>
        <code style="width: 4ch;">{{ device.temperature }}°C</code>
      </div>
      <table v-if="data.data.processes.length > 0">
        <thead>
          <tr><th>GPU</th><th>PID</th><th>User</th><th>Command</th><th>GPU Usage</th></tr>
        </thead>
        <tbody>
          <tr v-for="process in data.data.processes" :key="process.pid">
            <td>GPU{{ process.idx }}</td>
            <td>{{ process.pid }}</td>
            <td>{{ process.username }}</td>
            <td>{{ process.command }}</td>
            <td>{{ process.gpu_memory }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </div>
</template>

<script>
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default {
  props: {
    url: String,
    title: String,
    data_length: Number,
    sleep_time: Number
  },
  data() {
    return {
      data: {
        code: 0,
        data: {
          count: 0,
          devices: [],
          processes: []
        }
      },
      gpuUtilHistory: {}
    };
  },
  mounted() {
    this.fetchData();
    this.interval = setInterval(this.fetchData, this.sleep_time);
  },
  beforeDestroy() {
    clearInterval(this.interval);
  },
  methods: {
    fetchData() {
      axios.get(this.url)
        .then(response => {
          if (response.data.code !== 0) {
            console.error('Error fetching GPU data:', response.data);
            return;
          }
          this.data = response.data;
          for (let device of this.data.data.devices) {
            if (!this.gpuUtilHistory[device.idx]) {
              this.gpuUtilHistory[device.idx] = Array(this.data_length).fill(0);
            }
            this.gpuUtilHistory[device.idx].push(device.gpu_utilization);
            this.gpuUtilHistory[device.idx].shift();
          }
        })
        .catch(error => {
          console.error('Error fetching GPU data:', error);
        });
    }
  }
};
</script>

<style>
.g-container {
  width: 200px;
  height: 15px;
  border-radius: 3px;
  background: #eeeeee;
  display: inline-block;
}
.g-progress {
  height: inherit;
  border-radius: 3px 0 0 3px;
  background: #6e9bc5;
}
code {
  display: inline-block;
  text-align: right;
  background-color: #ffffff !important;
}
</style>
