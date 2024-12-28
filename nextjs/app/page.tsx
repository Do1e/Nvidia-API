import Link from "next/link";
import PerServer from "./components/perServer";
import type { Metadata } from "next";
import servers from "./servers.json";

export const metadata: Metadata = {
  title: "实验室GPU使用情况",
  description: "GPU Utilization in CITE Lab",
};

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-center">实验室GPU使用情况</h1>
      <div className="flex justify-center gap-x-2 mb-8">
        <Link
          href="https://www.do1e.cn/posts/citelab/server-help"
          className="text-blue-500"
        >
          服务器使用说明
        </Link>
      </div>
      <div>
        {Object.entries(servers).map(([key, value]) => (
          <PerServer key={key} url={value} title={key.toUpperCase()} internal_time={1000} />
        ))}
      </div>
    </div>
  );
}
