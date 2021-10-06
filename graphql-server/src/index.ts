import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import path from "path";
import * as fs from "fs";
import axios, { AxiosResponse } from "axios";

const PORT = process.env.PORT || 4000;
const GRAPHQL_FILENAME =
  process.env.GRAPHQL_FILENAME || path.join("..", "graphql", "todo.graphql");
const API_HOST = process.env.API_HOST || "http://localhost:8080";

// TODO: Use more sophisticated logger
console.debug(PORT);
console.debug(GRAPHQL_FILENAME);
console.debug(API_HOST);

// TODO: Move types elsewhere

type GraphQLID = string;

type GraphQLTodo = {
  id: GraphQLID;
  title: string;
};

type GraphQLTodoArgs = {
  id: GraphQLID;
};

type GraphQLTodoResponse = GraphQLTodo;

type GraphQLTodosArgs = {
  input: {
    filters: {
      // TODO: Add fields
    };
  };
};

type GraphQLTodosResponse = GraphQLTodo[];

type GraphQLCreateTodoArgs = {
  input: {
    todo: {
      title: string;
    };
  };
};

type GraphQLCreateTodoResponse = GraphQLTodo;

type GraphQLDeleteTodoArgs = {
  id: GraphQLID;
};

type GraphQLDeleteTodoResponse = GraphQLID;

type APITodo = {
  id: string;
  title: string;
};

type APIGetTodoResponse = {
  todo: APITodo;
};

type APIListTodosResponse = {
  todos: APITodo[];
};

type APICreateTodoRequest = {
  todo: {
    title: string;
  };
};

type APICreateTodoResponse = {
  todo: APITodo;
};

type APIDeleteTodoResponse = {};

const schemaFile = fs.readFileSync(GRAPHQL_FILENAME, "utf8");
const schema = buildSchema(schemaFile);

const root = {
  todo: async ({ id }: GraphQLTodoArgs): Promise<GraphQLTodoResponse> => {
    const response = await axios.get<APIGetTodoResponse>(
      `${API_HOST}/api/v1/todos/${id}`
    );
    return response.data.todo;
  },
  todos: async (args: GraphQLTodosArgs): Promise<GraphQLTodosResponse> => {
    const response = await axios.get<APIListTodosResponse>(
      `${API_HOST}/api/v1/todos`
    );
    return response.data.todos;
  },
  createTodo: async ({
    input: { todo },
  }: GraphQLCreateTodoArgs): Promise<GraphQLCreateTodoResponse> => {
    // TODO: Figure out how to replace any type with CreateTodoResponse type
    const response = await axios.post<
      APICreateTodoRequest,
      AxiosResponse<APICreateTodoResponse>
    >(`${API_HOST}/api/v1/todos`, {
      todo,
    });
    return response.data.todo;
  },
  deleteTodo: async ({
    id,
  }: GraphQLDeleteTodoArgs): Promise<GraphQLDeleteTodoResponse> => {
    await axios.delete<APIDeleteTodoResponse>(`${API_HOST}/api/v1/todos/${id}`);
    return id;
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
