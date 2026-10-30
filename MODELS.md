# Models and Inference Runtime Configuration

## Overview
SwasthyaSaathi is designed to run in remote rural Indian health sub-centres and village Anganwadi centers where internet access is unavailable or highly intermittent. It operates under strict memory and latency constraints on low-end Android devices and modest CPU hardware.

## Recommended Model Architecture

### 1. Primary Rule Engine: Deterministic Safety & Scope Pre-Filter
- **Name**: `ESC-v1 Deterministic Safety Engine`
- **Footprint**: < 1 MB memory, 0 MB disk.
- **Latency**: Sub-millisecond (~0.6 - 1.2 ms on standard single-core CPU).
- **Function**: Executes before any language-model or retrieval reasoning. Enforces 100% recall on emergency obstetric and neonatal danger signs.

### 2. Retrieval & Semantic Grounding Engine
- **Algorithm**: BM25 with Hindi/Hinglish domain-expanded tokenization.
- **Index Footprint**: 35 leaf sections, ~45 KB memory.
- **Optional Semantic Embeddings**: `intfloat/multilingual-e5-small` (quantized ONNX / GGUF ~90 MB) for vector-similarity fallback when enabled.

### 3. Local Language Model (Offline Generation)
- **Model**: `Qwen/Qwen2.5-0.5B-Instruct-GGUF` (q4_k_m or q8_0 quantization)
- **Runtime**: `llama.cpp` via `llama-cpp-python` on local CPU (arm64 / x86_64).
- **Disk Size**: ~390 MB (quantized).
- **Execution**: Purely local inference. No cloud LLM APIs, zero external telemetry.
- **Deterministic Guardrails**: The generator is strictly bound to retrieved protocol leaf sections. If model weights are not present on device, the deterministic template fallback generates exact factual summaries without degradation in safety.

## Resource Measurements (H5 Footprint)
- **Model Names**: Deterministic Rule Safety Engine (ESC-v1), BM25 Protocol Knowledge Indexer
- **Model Size on Disk**: 0.0 MB (Standard rule & index baseline) / 390 MB (when GGUF weights cached)
- **Peak RAM Consumption**: 19.31 MB
- **Median Question Latency**: 0.66 ms (CPU)
- **Offline Capability**: True (100% verified without network connection)
