config = {
    "llm" : {
        "provider": "gemini",
        "config": {
            "model": "gemini-1.5-flash-latest",
            "temperature": 0.2,
            "max_tokens": 2000,
            "api_key": "AIzaSyA_DwCnDeuBha-L-zyPy2hRZiq38Qjr82M"
        }
    },
    "embedder" :{
        "provider": "gemini",
        "config": {
            "model": "models/text-embedding-004",
            "embedding_dims": 384
        }
    },
    "graph_store": {
        "provider": "neo4j",
        "config": {
            "url": "neo4j+s://157220be.databases.neo4j.io",
            "username": "neo4j",
            "password": "IAccJFFCKJ32cWRBw523nor6rbXBeuvidFsXrfu6gJY"
        }
    },
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Jzvjd0Beek88xVKzLR4YotkTWJLCr-JIoO-6F5JSfgo",
            "url":"https://409cf7ee-e253-467b-b362-979e6ce06f21.us-west-1-0.aws.cloud.qdrant.io",
            "embedding_model_dims": 384,
            "collection_name": "mem0"
            
        }
    }
}