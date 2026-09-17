import { workerConfig } from "../_shared/config.ts";
import { createWorkerHandler } from "../_shared/handler.ts";
const config = workerConfig((key) => Deno.env.get(key));
Deno.serve(createWorkerHandler(config));
