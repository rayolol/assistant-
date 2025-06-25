import diskcache as dc
from memory.DB.Mongo.MongoDB import MongoDB
import os


class DiskCache:
    def __init__(self):
        self.cache = dc.Cache('./tmp/cache', 600)
        self.filePath =lambda name, id: os.path.join('./tmp/cache', f"{id}_{name}")
        self.cache.cull()


    def Write(self, filename: str, file_id: str, content: bytes):
    
        with open(self.filePath(filename, file_id), "wb") as f:
            f.write(content)
            self.cache.set(f'{file_id}', self.filePath(filename, file_id), expire=600)

        return True
    
    def Load(self, file_id):

        filepath = self.cache.get(f'{file_id}')

        if not filepath or not os.path.exists(filepath):
            return None

        
        with open(filepath, "rb") as f:
            content = f.read()

        return content
    
    def flush_cache_in_permanent_folder(self, file_id:str):
        
        filePath = self.cache.pop(f'{file_id}')
        if not filePath or not os.path.exists(filePath):
            raise FileNotFoundError("file not found or expired in cache")
        
        permanent_dir = './permanent_files'

        os.makedirs(permanent_dir, exist_ok=True)
        filename = os.path.basename(filePath)
        permanent_path = os.path.join(permanent_dir, filename)

        os.rename(filePath, permanent_path)

        self.cache.cull()

        print("succesfully returned permanent path")

        return permanent_path
    
    def get_permanent_file(self, path: str, file_id):
        with open(path, "rb") as f:
            content = f.read()

        return content



