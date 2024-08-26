# Task Management API

This project is a RESTful API for managing projects and tasks, built using Node.js, Express, TypeScript, MongoDB, and AWS Cognito for user authentication. The API provides endpoints to create, read, update, and delete projects and tasks, as well as user authentication and authorization using JSON Web Tokens (JWTs).

## Technologies Used

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js.
- **TypeScript**: Typed superset of JavaScript.
- **MongoDB**: NoSQL database for storing project and task data.
- **Mongoose**: MongoDB object modeling tool for Node.js.
- **AWS Cognito**: Service for user authentication and authorization.
- **JWT**: JSON Web Tokens for secure user authentication.
- **dotenv**: Module to load environment variables from a `.env` file.

## Prerequisites

Before running the application, ensure you have the following:

- Node.js and npm installed
- MongoDB instance running
- AWS Cognito setup with user pool and client
- Environment variables configured in a `.env` file

## Environment Variables

Create a `.env` file in the root directory with the following variables:

COGNITO_USER_POOL_ID=your_cognito_user_pool_id
COGNITO_CLIENT_ID=your_cognito_client_id
COGNITO_REGION=your_aws_region
COGNITO_CLIENT_SECRET=your_cognito_client_secret
MONGODB_URI=your_mongodb_uri
PORT=3001

## Project Structure

- `models/`: Contains Mongoose models for `Task` and `Project`.
- `middlewares/`: Contains middleware for authentication.
- `routes/`: Contains routes for projects and tasks.

## API Endpoints

### Authentication

    POST /login: Authenticate a user with username and password.
    POST /respond-to-new-password-challenge: Respond to a new password challenge during authentication.
    GET /verify: Verify the JWT token.

### Projects

    POST /projects: Create a new project (Authenticated).
    GET /projects: Get all projects (Authenticated).
    PUT /projects/
    : Update a project by ID (Authenticated).
    DELETE /projects/
    : Delete a project by ID and its associated tasks (Authenticated).

### Tasks

    POST /projects/:projectId/tasks
    /tasks: Create a new task within a project (Authenticated).
    GET /projects/:projectId/tasks
    /tasks: Get all tasks within a project (Authenticated).
    PUT /projects/:projectId/tasks/:taskId
    /tasks/
    : Update a task by ID (Authenticated).
    DELETE /projects/:projectId/tasks/:taskId
    /tasks/
    : Delete a task by ID (Authenticated).

## Middleware

    authenticate
    This middleware checks for a JWT in the Authorization header, verifies the token using AWS Cognito, and attaches the user information to the request object.

## Mongoose Models

### Project

name: The name of the project (required).
description: A description of the project (required).
tasks: An array of task references associated with the project.

### Task

title: The title of the task (required).
description: A description of the task (required).
status: The current status of the task, which can be todo, in-progress, or done (default is todo).
projectId: A reference to the project to which the task belongs (required).

## Integration Testing

This project includes an integration test script written in Python to verify the functionality of the API with AWS Cognito authentication. The script tests the following:

### Authentication:

Logs in with the provided username and password.
Handles password challenge if required.
Verifies the obtained JWT token.

### Project and Task Operations (Authenticated):

Creates a new project.
Creates a new task within the project.
Retrieves all tasks in the project.
Updates a task's status.
Deletes a task.

### Unauthorized Access (Unauthenticated):

Attempts to create a project without authentication.
Attempts to create, retrieve, update, and delete tasks without authentication.

## Getting Started

1. **Install dependencies**:

```bash
npm install
```

2. **run MongoDB on docker**:

```bash
docker run -d -p 27017:27017 mongo
```

3. **Create the `.env` file in the root directory, as describe above**


4. **Run the Program**:

```bash
ts-node src/server.ts
```

5. **Running the Integration Test:**
   create virtual env, install requests pyjwt, and run the integration_test

```bash
python3 -m venv .venv
source .venv/bin/activate
pip3 install requests pyjwt
python3 integration_test/integration_test.py <username> <password> [--new-password <new_password>] [--base-url <base_url>]
```

Replace <username> and <password> with your AWS Cognito credentials.
If the password challenge is required, provide a new password with the --new-password option.
The --base-url option allows you to specify the API's base URL (default is http://localhost:3001).

6. **Login with new user**:

- Manually create a new user in your user pool in AWS Cognito (if you generate a password make sure to send an email invitation)
- Log in with the user, add the json with your username and password to the body (you can use postman).
  ```json
  {
  "username":"{your_username}",
  "password":"{your_password}"
    }
    ```
- In the first logging, you will be ask to change password, and will recieve a session, copy it.
- Create a respond-to-new-password-challenge Post request, add a json with your username, newPassword and the session.

    ```json
  {
  "username":"{your_username}",
  "newPassword":"{your_new_password}",
  "session": "{session_from_login_request}"
  }
    ```
- This request will return the IdToken.
- Add a header 'authorization' with the IdToken to create, get, update and delete projects and tasks. 

## Suggested Deployment Strategy for Handling 10k Users a Day:

Deploy the app using AWS Lambda for serverless execution.
Use AWS API Gateway to route HTTP requests to Lambda functions, that will manage scale automatically.
Use Amazon DocumentDB (MongoDB-compatible) as the database, ensuring seamless integration with AWS and scalable, managed hosting.
Deploy the Next.js client with AWS Amplify, providing automatic builds, global CDN, and easy environment variable management.
