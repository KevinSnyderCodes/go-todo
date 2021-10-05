import express from "express";
import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";
import path from "path";
import * as fs from "fs";
import axios from "axios";

const PORT = process.env.PORT || 4000;
const GRAPHQL_FILENAME =
  process.env.GRAPHQL_FILENAME || path.join("..", "graphql", "todo.graphql");

const schemaFile = fs.readFileSync(GRAPHQL_FILENAME, "utf8");

type Todo = {
  id: string;
  title: string;
};

type GetTodoInput = {
  id: number;
};

type CreateTodoInput = {
  todo: {
    title: string;
  };
};

type DeleteTodoInput = {
  id: number;
};

type GetTodoResponse = {
  todo: Todo
}

type ListTodosResponse = {
  todos: Todo[]
}

type CreateTodoResponse = {
  todo: Todo
}

type DeleteTodoResponse = {}

const schema = buildSchema(schemaFile);

const root = {
  getTodo: async ({ id }: GetTodoInput): Promise<Todo> => {
    const response = await axios.get<GetTodoResponse>(`http://localhost:8080/api/v1/todos/${id}`)
    return response.data.todo;
  },
  listTodos: async (): Promise<Todo[]> => {
    const response = await axios.get<ListTodosResponse>("http://localhost:8080/api/v1/todos");
    return response.data.todos;
  },
  createTodo: async ({ todo }: CreateTodoInput): Promise<Todo> => {
    // TODO: Figure out how to not use any type here
    const response = await axios.post<any>("http://localhost:8080/api/v1/todos", {
      todo
    });
    return response.data.todo;
  },
  deleteTodo: async ({ id }: DeleteTodoInput) => {
    await axios.delete<DeleteTodoResponse>(`http://localhost:8080/api/v1/todos/${id}`);
  },
};

const app = express();

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
