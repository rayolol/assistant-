"""
Test script to verify that the core modules are working
"""
import sys
sys.path.append('.')

# Import the core modules
from core import prompts

# Print a success message
print("Successfully imported core modules")
print("Prompts module contains:", dir(prompts))
