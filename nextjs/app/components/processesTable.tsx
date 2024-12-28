import { Table } from 'antd';
import type { TableProps } from 'antd';
import type { ProcessesDataType } from './types';

interface ProcessesTableProps {
  data: ProcessesDataType[];
}

const columns: TableProps<ProcessesDataType>['columns'] = [
  {
    title: 'GPU',
    dataIndex: 'idx',
    key: 'idx',
    render: (idx) => `GPU${idx}`,
  },
  {
    title: 'PID',
    dataIndex: 'pid',
    key: 'pid',
  },
  {
    title: 'User',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: 'Command',
    dataIndex: 'command',
    key: 'command',
  },
  {
    title: 'GPU Usage',
    dataIndex: 'gpu_memory',
    key: 'gpu_memory',
  },
]

export default function ProcessesTable({ data }: ProcessesTableProps) {
  if (data.length === 0) {
    return null;
  }
  return (
    <div>
      <Table<ProcessesDataType>
        columns={columns}
        dataSource={data.map((item, index) => ({ ...item, key: index }))}
        size="small"
        pagination={false}
      />
    </div>
  )
}
