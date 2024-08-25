# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "requests",
#     "pyjwt",
# ]
# ///
import argparse
from pprint import pprint
import requests

# Set up argument parsing for CLI input
parser = argparse.ArgumentParser(description="Test project management API with AWS Cognito authentication.")
parser.add_argument("username", help="Username for authentication")
parser.add_argument("password", help="Password for authentication")
parser.add_argument("--new-password", help="New password if a password change is required", default=None)
parser.add_argument("--base-url", help="Base URL of the authentication server", default="http://localhost:3001")

args = parser.parse_args()

username = args.username
password = args.password
new_password = args.new_password
base_url = args.base_url

# Authentication function
def authenticate(username, password, new_password):
    login_url = f"{base_url}/login"
    login_response = requests.post(login_url, json={
        "username": username,
        "password": password
    })
    login_response.raise_for_status()

    login_data = login_response.json()
    session = login_data.get("session")
    id_token = login_data.get("IdToken")

    if session:
        print("Password challenge required. Proceeding with new password...")
        if not new_password:
            raise ValueError("No new password provided. Cannot proceed with password challenge.")

        respond_url = f"{base_url}/respond-to-new-password-challenge"
        respond_response = requests.post(respond_url, json={
            "username": username,
            "newPassword": new_password,
            "session": session
        })
        respond_response.raise_for_status()
        id_token = respond_response.json().get("IdToken")

    if not id_token:
        raise ValueError("Failed to authenticate and obtain idToken.")

    return id_token

# Verify token function
def verify_token(id_token):
    verify_url = f"{base_url}/verify"
    verify_response = requests.get(verify_url, headers={"Authorization": f"Bearer {id_token}"})
    verify_response.raise_for_status()
    print("Token is valid.")

# Helper function to handle API requests
def make_request(method, url, headers=None, data=None):
    if method == "post":
        response = requests.post(url, json=data, headers=headers)
    elif method == "put":
        response = requests.put(url, json=data, headers=headers)
    elif method == "delete":
        response = requests.delete(url, headers=headers)
    else:
        response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

# Unauthorized access test function
def test_unauthenticated_access(url, method="get", data=None):
    try:
        make_request(method, url, data=data)
        print(f"Unauthenticated access to {url} was incorrectly allowed.")
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            print(f"Unauthenticated access to {url} correctly denied with status 401.")
        else:
            print(f"Unexpected error occurred: {e.response.status_code}")

# Function to create a project
def create_project(id_token, name="Test Project", description="This is a test project"):
    project_url = f"{base_url}/projects"
    headers = {"Authorization": f"Bearer {id_token}"}
    new_project_data = {"name": name, "description": description}
    return make_request("post", project_url, headers=headers, data=new_project_data)

# Function to create a task
def create_task(id_token, project_id, title="Test Task", description="This is a test task", status="todo"):
    task_url = f"{base_url}/projects/{project_id}/tasks"
    headers = {"Authorization": f"Bearer {id_token}"}
    new_task_data = {"title": title, "description": description, "status": status}
    return make_request("post", task_url, headers=headers, data=new_task_data)

# Function to get tasks
def get_tasks(id_token, project_id):
    tasks_url = f"{base_url}/projects/{project_id}/tasks"
    headers = {"Authorization": f"Bearer {id_token}"}
    return make_request("get", tasks_url, headers=headers)

# Function to update a task
def update_task(id_token, project_id, task_id, status="in-progress"):
    update_task_url = f"{base_url}/projects/{project_id}/tasks/{task_id}"
    headers = {"Authorization": f"Bearer {id_token}"}
    update_task_data = {"status": status}
    return make_request("put", update_task_url, headers=headers, data=update_task_data)

# Function to delete a task
def delete_task(id_token, project_id, task_id):
    delete_task_url = f"{base_url}/projects/{project_id}/tasks/{task_id}"
    headers = {"Authorization": f"Bearer {id_token}"}
    return make_request("delete", delete_task_url, headers=headers)

# Authenticate and get the idToken
id_token = authenticate(username, password, new_password)

# Verify the token
verify_token(id_token)

# Step 3: Test Project and Task operations (Authenticated)
created_project = create_project(id_token)
project_id = created_project['_id']
print("Created Project:", created_project)

created_task = create_task(id_token, project_id)
task_id = created_task['_id']
print("Created Task:", created_task)

tasks = get_tasks(id_token, project_id)
print("Tasks in Project:", tasks)

updated_task = update_task(id_token, project_id, task_id)
print("Updated Task:", updated_task)

deleted_task = delete_task(id_token, project_id, task_id)
print("Deleted Task:", deleted_task)

# Step 4: Test Unauthorized Access (Unauthenticated)
test_unauthenticated_access(f"{base_url}/projects", method="post", data={"name": "Test Project", "description": "Unauthorized"})
test_unauthenticated_access(f"{base_url}/projects/{project_id}/tasks", method="post", data={"title": "Test Task", "description": "Unauthorized"})
test_unauthenticated_access(f"{base_url}/projects/{project_id}/tasks")
test_unauthenticated_access(f"{base_url}/projects/{project_id}/tasks/{task_id}", method="put", data={"status": "done"})
test_unauthenticated_access(f"{base_url}/projects/{project_id}/tasks/{task_id}", method="delete")