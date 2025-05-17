from dotenv import load_dotenv
from pydantic import  Field
from pydantic_settings import BaseSettings
from typing import Optional

load_dotenv();

class Settings(BaseSettings):
    # === Core Model Config ===
    MODEL_NAME: str
    API_KEY: str
    BASE_URL: str

    # === Memory Model Config ===
    MEMORY_LLM_PROVIDER: str = "gemini"
    MEMORY_LLM_MODEL: str = "gemini-1.5-flash-latest"
    MEMORY_LLM_API_KEY: Optional[str]
    MEMORY_LLM_EMBEDDING_MODEL: str = "models/text-embedding-004"

    # === Graph Store (Neo4j) ===
    NEO4J_URL: str = "neo4j+s://157220be.databases.neo4j.io"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str

    # === Vector Store ===
    VECTOR_STORE_PROVIDER: str = "qdrant"
    QDRANT_API_KEY: Optional[str]
    QDRANT_URL: str = "https://409cf7ee-e253-467b-b362-979e6ce06f21.us-west-1-0.aws.cloud.qdrant.io"
    QDRANT_COLLECTION_NAME: str = "mem0"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
