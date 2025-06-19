#!/usr/bin/env python3
"""
Script to start the SciEcho FastAPI server
"""
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    # Check if API key is set
    api_key = os.getenv("MY_API_KEY")
    if not api_key:
        print("ERROR: MY_API_KEY environment variable is not set!")
        print("Please set your Groq API key in the .env file or as an environment variable.")
        return
    
    print("Starting SciEcho FastAPI server...")
    print("Server will be available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()