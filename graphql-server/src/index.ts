import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import path from "path";
import * as fs from "fs";
import axios from "axios";

const PORT = process.env.PORT || 4000;
const GRAPHQL_FILENAME =
  process.env.GRAPHQL_FILENAME || path.join("..", "graphql", "todo.graphql");
const API_HOST = process.env.API_HOST || "http://localhost:8080";

// TODO: Use more sophisticated logger
console.debug(PORT);
console.debug(GRAPHQL_FILENAME);
console.debug(API_HOST);

const schemaFile = fs.readFileSync(GRAPHQL_FILENAME, "utf8");

type Todo = {
  id: string;
  title: string;
};

type GetTodoInput = {
  id: number;
};

type CreateTodoInput = {
  input: {
    title: string;
  };
};

type DeleteTodoInput = {
  id: number;
};

type GetTodoResponse = {
  todo: Todo;
};

type ListTodosResponse = {
  todos: Todo[];
};

type CreateTodoResponse = {
  todo: Todo;
};

type DeleteTodoResponse = {};

const schema = buildSchema(schemaFile);

const root = {
  getTodo: async ({ id }: GetTodoInput): Promise<Todo> => {
    const response = await axios.get<GetTodoResponse>(
      `${API_HOST}/api/v1/todos/${id}`
    );
    return response.data.todo;
  },
  listTodos: async (): Promise<Todo[]> => {
    const response = await axios.get<ListTodosResponse>(
      `${API_HOST}/api/v1/todos`
    );
    return response.data.todos;
  },
  createTodo: async ({ input }: CreateTodoInput): Promise<Todo> => {
    // TODO: Figure out how to replace any type with CreateTodoResponse type
    const response = await axios.post<any>(`${API_HOST}/api/v1/todos`, {
      todo: input,
    });
    return response.data.todo;
  },
  deleteTodo: async ({ id }: DeleteTodoInput) => {
    await axios.delete<DeleteTodoResponse>(`${API_HOST}/api/v1/todos/${id}`);
  },
};

const app = express();

// CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );

  if ("OPTIONS" === req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
