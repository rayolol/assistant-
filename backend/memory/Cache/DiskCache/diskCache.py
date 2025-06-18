import diskcache as dc
import os


class DiskCache:
    def __init__(self):
        self.cache = dc.Cache('./tmp/cache', 60)
        self.filePath =lambda name, id: os.path.join('./tmp/cache', f"{id}_{name}")


    def Write(self, filename: str, file_id: str, content: bytes):
    
        with open(self.filePath(filename, file_id), "wb") as f:
            f.write(content)
            self.cache.set(f'{file_id}', self.filePath(filename, file_id), expire=600)

        return True
    
    def Load(self, file_id):

        filepath = self.cache.get(f'{file_id}')

        if not filepath or not os.path.exists(filepath):
            raise FileNotFoundError("File not found or expired")
        
        with open(filepath, "rb") as f:
            content = f.read()

        return content
