# project_agent_with_shell.py

import os
import subprocess
from langchain_community.llms import Ollama
from langchain.agents import initialize_agent, Tool

# --- File system tools ---
def create_file(filename, content=""):
    with open(filename, "w") as f:
        f.write(content)
    return f"File {filename} created."

def delete_file(filename):
    os.remove(filename)
    return f"File {filename} deleted."

def modify_file(filename, new_content):
    with open(filename, "w") as f:
        f.write(new_content)
    return f"File {filename} modified."

def create_folder(foldername):
    os.makedirs(foldername, exist_ok=True)
    return f"Folder {foldername} created."

def list_files(path="."):
    files = os.listdir(path)
    return f"Files in {path}: {files}"

def read_file(filename):
    with open(filename, "r") as f:
        content = f.read()
    return f"Contents of {filename}:\n{content}"

# --- Shell command tool ---
def run_shell(command):
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return f"Command output:\n{result.stdout}\nErrors:\n{result.stderr}"
    except Exception as e:
        return f"Error running command: {e}"

# --- Register tools ---
tools = [
    Tool(name="create_file", func=create_file, description="Create a new file with optional content"),
    Tool(name="delete_file", func=delete_file, description="Delete a file"),
    Tool(name="modify_file", func=modify_file, description="Modify a file with new content"),
    Tool(name="create_folder", func=create_folder, description="Create a new folder"),
    Tool(name="list_files", func=list_files, description="List files in a directory"),
    Tool(name="read_file", func=read_file, description="Read the contents of a file"),
    Tool(name="run_shell", func=run_shell, description="Run a shell command in the current directory"),
]

# --- Load local Ollama model ---
llm = Ollama(model="codellama")

# --- Initialize agent ---
agent = initialize_agent(
    tools,
    llm,
    agent="zero-shot-react-description",
    verbose=True
)

# --- Example usage ---
if __name__ == "__main__":
    while True:
        user_input = input("Ask the agent: ")
        if user_input.lower() in ["quit", "exit"]:
            break
        print(agent.run(user_input))