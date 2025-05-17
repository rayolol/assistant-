import sys
from dotenv import load_dotenv
from agents.extensions.models.litellm_model import LitellmModel
from config import settings
from agents import set_tracing_disabled

# Set UTF-8 for I/O
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()
set_tracing_disabled(disabled=True)

# Instantiate your base model
Model = LitellmModel(
    api_key=settings.API_KEY,
    base_url=settings.BASE_URL,
    model=settings.MODEL_NAME
)

# Structure the memory config dict
MEMORY_Config = {
    "llm": {
        "provider": settings.MEMORY_LLM_PROVIDER,
        "config": {
            "model": settings.MEMORY_LLM_MODEL,
            "temperature": 0.2,
            "max_tokens": 2000,
            "api_key": settings.MEMORY_LLM_API_KEY
        }
    },
    "embedder": {
        "provider": settings.MEMORY_LLM_PROVIDER,
        "config": {
            "model": settings.MEMORY_LLM_EMBEDDING_MODEL,
            "embedding_dims": 384
        }
    },
    "graph_store": {
        "provider": "neo4j",
        "config": {
            "url": settings.NEO4J_URL,
            "username": settings.NEO4J_USERNAME,
            "password": settings.NEO4J_PASSWORD
        }
    },
    "vector_store": {
        "provider": settings.VECTOR_STORE_PROVIDER,
        "config": {
            "api_key": settings.QDRANT_API_KEY,
            "url": settings.QDRANT_URL,
            "embedding_model_dims": 384,
            "collection_name": settings.QDRANT_COLLECTION_NAME
        }
    }
}
