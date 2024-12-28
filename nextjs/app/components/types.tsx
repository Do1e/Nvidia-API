export interface GPUInfoType {
  idx: number;
  name: string;
  fan_speed: number;
  temperature: number;
  power_status: string;
  gpu_utilization: number;
  memory_total_human: string;
  memory_used_human: string;
  memory_free_human: string;
  memory_utilization: number;
  ts: number;
}

export interface ProcessesDataType {
  idx: number;
  pid: number;
  username: string;
  command: string;
  type: string;
  gpu_memory: string;
}

export interface ServerType {
  code: number;
  data: {
    devices: GPUInfoType[];
    processes: ProcessesDataType[];
  };
}
