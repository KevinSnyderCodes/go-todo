import React, { useState } from "react";

import {
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { useQuery, useMutation, gql } from "@apollo/client";

// TODO: Move types elsewhere
// TODO: Move GraphQL queries/mutations elsewhere
// TODO: Move components elsewhere
// (Maybe couple components, queries/mutations, and types?)
// (Maybe couple queries/mutations and types, then import to components?)

type GraphQLID = string;

type GraphQLTodo = {
  id: GraphQLID;
  title: string;
};

const TODOS = gql`
  query Todos {
    todos {
      id
      title
    }
  }
`;

type GraphQLTodosData = {
  todos: GraphQLTodo[];
};

const CREATE_TODO = gql`
  mutation CreateTodo($input: CreateTodoInput) {
    createTodo(input: $input) {
      id
      title
    }
  }
`;

type GraphQLCreateTodoArgs = {
  input: {
    todo: {
      title: string;
    };
  };
};

type GraphQLCreateTodoData = {
  createTodo: GraphQLTodo;
};

const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID) {
    deleteTodo(id: $id)
  }
`;

type GraphQLDeleteTodoData = {
  id: GraphQLID;
};

function TodoList() {
  const { loading, error, data } = useQuery<GraphQLTodosData>(TODOS);

  if (loading) return <p>Loading...</p>;
  if (error) {
    console.error(error);
    return <p>Error!</p>;
  }

  let todos: GraphQLTodo[] = [];
  if (data) todos = data.todos;

  return (
    <List>
      {todos.map((todo) => (
        <TodoItem todo={todo} />
      ))}
    </List>
  );
}

type TodoItemProps = {
  todo: GraphQLTodo;
};

function TodoItem({ todo }: TodoItemProps) {
  const [deleteTodo, { loading, error, data }] =
    useMutation<GraphQLDeleteTodoData>(DELETE_TODO, {
      refetchQueries: [TODOS],
      awaitRefetchQueries: true,
    });

  if (error) {
    console.error(error);
    return <p>Error!</p>;
  }

  return (
    <ListItem
      key={todo.id}
      secondaryAction={
        loading ? (
          <CircularProgress />
        ) : (
          <IconButton
            onClick={() => {
              deleteTodo({
                variables: {
                  id: todo.id,
                },
              });
            }}
          >
            <DeleteIcon />
          </IconButton>
        )
      }
    >
      <ListItemButton>
        <ListItemIcon>
          <Checkbox />
        </ListItemIcon>
        <ListItemText primary={todo.title} />
      </ListItemButton>
    </ListItem>
  );
}

function TodoInput() {
  const [value, setValue] = useState("");
  const [createTodo, { loading, error, data }] = useMutation<
    GraphQLCreateTodoData,
    GraphQLCreateTodoArgs
  >(CREATE_TODO, {
    refetchQueries: [TODOS],
  });

  if (loading) return <p>Loading...</p>;
  if (error) {
    console.error(error);
    return <p>Error!</p>;
  }

  return (
    <List>
      <ListItem>
        <FormControl>
          <TextField
            fullWidth
            label="Enter a todo..."
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                createTodo({
                  variables: {
                    input: {
                      todo: {
                        title: value,
                      },
                    },
                  },
                });
                setValue("");
              }
            }}
          />
        </FormControl>
      </ListItem>
    </List>
  );
}

function App() {
  return (
    <Container>
      <Paper>
        <TodoList />
        <TodoInput />
      </Paper>
    </Container>
  );
}

export default App;
