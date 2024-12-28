"use client";
import { useEffect, useState } from 'react';
import { Collapse, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import ProcessesTable from './processesTable';
import PerGPU from './perGPU';
import type { GPUInfoType, ServerType } from './types';

interface PerServerProps {
  url: string;
  title: string;
  internal_time?: number;
}

export default function PerServer({ url, title, internal_time=1000 }: PerServerProps) {
  const [data, setData] = useState< ServerType | null>(null);
  const [activeKey, setActiveKey] = useState<string[]>(['0']);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setData(data);
        });
    }, internal_time);

    return () => clearInterval(interval);
  }, [url, internal_time]);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.split('=');
      if (key.trim() === title) {
        setActiveKey(value === 'true' ? [] : ['0']);
        break;
      }
    }
  }, [title]);

  const handleHide = () => {
    const date = new Date();
    date.setTime(date.getTime() + (365*24*60*60*1000));
    document.cookie = `${title}=true; expires=${date.toUTCString()}`;
  };

  const handleShow = () => {
    const date = new Date();
    date.setTime(date.getTime() + (365*24*60*60*1000));
    document.cookie = `${title}=false; expires=${date.toUTCString()}`;
  };

  const handleCollapseChange = (key: string | string[]) => {
    if (key.length === 0) {
      handleHide();
    } else {
      handleShow();
    }
    setActiveKey(typeof key === 'string' ? [key] : key);
  };

  return (
    <div className='container'>
      <Collapse activeKey={activeKey} onChange={handleCollapseChange} items={
        [
          {
            key: '0',
            label: <h2 className="text-black dark:text-white text-center">{title}</h2>,
            children: data && data.code === 0 ? (
              <div className='space-y-2'>
                {data.data.devices.map((gpu: GPUInfoType) => (
                  <PerGPU title={title} key={gpu.idx} data={gpu} />
                ))}
                <ProcessesTable data={data.data.processes} />
              </div>
            ) : <Spin indicator={<LoadingOutlined spin />} />
          }
        ]
      } />
    </div>
  );
}