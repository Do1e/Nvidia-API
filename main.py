from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from nvitop import Device
import os
import asyncio
from contextlib import asynccontextmanager
import time

suburl = os.environ.get("SUBURL", "")
if suburl != "" and not suburl.startswith("/"):
    suburl = "/" + suburl
frp_path = os.environ.get("FRP_PATH", "/home/peijie/Nvidia-API/frp")
if not os.path.exists(f"{frp_path}/frpc") or not os.path.exists(
    f"{frp_path}/frpc.toml"
):
    raise FileNotFoundError("frpc or frpc.toml not found in FRP_PATH")


@asynccontextmanager
async def run_frps(app: FastAPI):
    time.sleep(20)
    command = [f"{frp_path}/frpc", "-c", f"{frp_path}/frpc.toml"]
    process = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
        stdin=asyncio.subprocess.DEVNULL,
        close_fds=True,
    )
    try:
        yield
    finally:
        try:
            process.terminate()
            await process.wait()
        except ProcessLookupError:
            pass


app = FastAPI(lifespan=run_frps)

app.add_middleware(GZipMiddleware, minimum_size=100)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(f"{suburl}/count")
async def get_ngpus(request: Request):
    try:
        ngpus = Device.count()
        return JSONResponse(content={"code": 0, "data": ngpus})
    except Exception as e:
        return JSONResponse(
            content={"code": -1, "data": None, "error": str(e)}, status_code=500
        )


@app.get(f"{suburl}/status")
async def get_status(request: Request):
    try:
        ngpus = Device.count()
    except Exception as e:
        return JSONResponse(
            content={"code": -1, "data": None, "error": str(e)}, status_code=500
        )

    idx = request.query_params.get("idx", None)
    if idx is not None:
        try:
            idx = idx.split(",")
            idx = [int(i) for i in idx]
            for i in idx:
                if i < 0 or i >= ngpus:
                    raise ValueError("Invalid GPU index")
        except ValueError:
            return JSONResponse(
                content={"code": 1, "data": None, "error": "Invalid GPU index"},
                status_code=400,
            )
    else:
        idx = list(range(ngpus))
    process_type = request.query_params.get("process", "")
    if process_type not in ["", "C", "G", "NA"]:
        return JSONResponse(
            content={
                "code": 1,
                "data": None,
                "error": "Invalid process type, choose from C, G, NA",
            },
            status_code=400,
        )
    try:
        # data = {"processes": [], "devices": []}
        devices = []
        processes = []
        for i in idx:
            device = Device(i)
            devices.append(
                {
                    "idx": i,
                    "name": device.name(),
                    "fan_speed": device.fan_speed(),
                    "temperature": device.temperature(),
                    "power_status": device.power_status(),
                    "gpu_utilization": device.gpu_utilization(),
                    "memory_total_human": f"{round(device.memory_total() / 1024 / 1024)}MiB",
                    "memory_used_human": f"{round(device.memory_used() / 1024 / 1024)}MiB",
                    "memory_free_human": f"{round(device.memory_free() / 1024 / 1024)}MiB",
                    "memory_utilization": round(device.memory_used() / device.memory_total() * 100),
                    "ts": round(time.time() * 1000),
                }
            )
            now_processes = device.processes()
            sorted_pids = sorted(now_processes)
            for pid in sorted_pids:
                process = now_processes[pid]
                if process_type == "" or process_type in process.type:
                    processes.append(
                        {
                            "idx": i,
                            "pid": process.pid,
                            "username": process.username(),
                            "command": process.command(),
                            "type": process.type,
                            "gpu_memory": f"{round(process.gpu_memory() / 1024 / 1024)}MiB",
                        }
                    )
        return JSONResponse(
            content={
                "code": 0,
                "data": {"count": ngpus, "devices": devices, "processes": processes},
            }
        )
    except Exception as e:
        return JSONResponse(
            content={"code": -1, "data": None, "error": str(e)}, status_code=500
        )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="127.0.0.1", port=port, reload=False)
