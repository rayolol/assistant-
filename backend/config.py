from dotenv import load_dotenv
from agents import set_tracing_disabled
import sys

from agents.extensions.models.litellm_model import LitellmModel
import os
sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME") or ""
API_KEY = os.getenv("API_KEY") or ""
BASE_URL = os.getenv("BASE_URL") or ""
if not MODEL_NAME or not API_KEY or not BASE_URL:
    raise ValueError("MODEL_NAME, API_KEY, and BASE_URL must be set in the environment variables.")
set_tracing_disabled(disabled=True)

Model = LitellmModel(api_key=API_KEY, base_url=BASE_URL, model=MODEL_NAME)


