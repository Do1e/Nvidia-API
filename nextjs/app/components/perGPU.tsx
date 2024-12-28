"use client";
import { Progress, Collapse } from 'antd';
import { Line } from '@ant-design/charts';
import { useEffect, useState } from 'react';
import type { GPUInfoType } from './types';

interface PerGPUProps {
  title: string;
  data: GPUInfoType;
  internal_time?: number;
}

const progressColors = ['#00A0FF', '#FFB000', '#FF7030'];

function renderProgress(percent: number) {
  return (
    <Progress
      percent={percent}
      percentPosition={{ align: 'start', type: 'outer' }}
      strokeLinecap="butt"
      success={{ strokeColor: progressColors[percent < 70 ? 0 : percent < 90 ? 1 : 2] }}
      size={{ height: 15 }}
      strokeColor={progressColors[percent < 70 ? 0 : percent < 90 ? 1 : 2]}
      format={(percent) => <span className="text-black dark:text-white">
        {`${percent}%`}
      </span>}
    />
  );
}

function renderInfo(data: GPUInfoType) {
  return (
    <div>
      <div className='mb-2'>
        <div className='font-medium'>GPU{data.idx} - {data.name}</div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='flex items-center gap-x-3'>
          <div className='whitespace-nowrap'>显存：</div>
          <div className='flex-1'>{renderProgress(data.memory_utilization)}</div>
          <div className='whitespace-nowrap text-sm text-gray-600 dark:text-gray-400'>
            {data.memory_used_human}/{data.memory_total_human}
          </div>
        </div>
        <div className='flex items-center gap-x-3'>
          <div className='whitespace-nowrap'>利用率：</div>
          <div className='flex-1'>{renderProgress(data.gpu_utilization)}</div>
          <div className='whitespace-nowrap text-sm'>
            <span style={{
              color: progressColors[data.temperature >= 80 ? 2 : data.temperature >= 60 ? 1 : 0]
            }}>
              {data.temperature}°C
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PerGPU({ title, data, internal_time=1000 }: PerGPUProps) {
  const gpuid = `${title}-GPU${data.idx}`;
  const [activeKey, setActiveKey] = useState<string[]>(['0']);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.split('=');
      if (key.trim() === gpuid) {
        setActiveKey(value === 'true' ? ['0'] : ['1']);
        break;
      }
    }
  }, [gpuid]);

  const handleHide = () => {
    const date = new Date();
    date.setTime(date.getTime() + (365*24*60*60*1000));
    document.cookie = `${gpuid}=true; expires=${date.toUTCString()}`;
  };

  const handleShow = () => {
    const date = new Date();
    date.setTime(date.getTime() + (365*24*60*60*1000));
    document.cookie = `${gpuid}=false; expires=${date.toUTCString()}`;
  };

  const handleCollapseChange = (key: string | string[]) => {
    if (key.length === 0) {
      handleHide();
    } else {
      handleShow();
    }
    setActiveKey(typeof key === 'string' ? [key] : key);
  };

  const length = 200;
  const [gpuUtilList, setGpuUtilList] = useState<number[]>(Array(length).fill(0));
  useEffect(() => {
    if (data?.gpu_utilization !== undefined) {
      setGpuUtilList(prev => {
        const next = [...prev, data.gpu_utilization];
        if (next.length > length) next.shift();
        return next;
      });
    }
  }, [data]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 检测系统主题
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    // 监听系统主题变化
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const config = {
    data: gpuUtilList.map((v, i) => ({ time: `${((length - i) * internal_time / 1000).toString()}s`, value: v })),
    xField: 'time',
    yField: 'value',
    height: 200,
    seriesField: 'gpuType',
    shapeField: 'smooth',
    autoFit: true,
    animate: false,
    theme: isDarkMode ? 'classicDark' : 'classic',
    scale: {
      y: {
        type: 'linear',
        domain: [0, 100],
      }
    }
  };
  return (
    <div className='w-full'>
      <Collapse activeKey={activeKey} onChange={handleCollapseChange} className='mt-2' items={[{ key: '1', label: renderInfo(data), children: <Line {...config} /> }]} size="small" />
    </div>
  )
}
