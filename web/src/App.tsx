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

type Todo = {
  id: number;
  title: string;
};

const LIST_TODOS = gql`
  query ListTodos {
    listTodos {
      id
      title
    }
  }
`;

type ListTodosResponse = {
  listTodos: Todo[];
};

const CREATE_TODO = gql`
  mutation CreateTodo($input: CreateTodoInput) {
    createTodo(input: $input) {
      id
      title
    }
  }
`;

type CreateTodoResponse = {
  createTodo: Todo;
};

const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID) {
    deleteTodo(id: $id)
  }
`;

type DeleteTodoResponse = {};

function TodoList() {
  const { loading, error, data } = useQuery<ListTodosResponse>(LIST_TODOS);

  if (loading) return <p>Loading...</p>;
  if (error) {
    console.error(error);
    return <p>Error!</p>;
  }

  let todos: Todo[] = [];
  if (data) todos = data.listTodos;

  return (
    <List>
      {todos.map((todo) => (
        <TodoItem todo={todo} />
      ))}
    </List>
  );
}

type TodoItemProps = {
  todo: Todo;
};

function TodoItem({ todo }: TodoItemProps) {
  const [deleteTodo, { loading, error, data }] =
    useMutation<DeleteTodoResponse>(DELETE_TODO, {
      refetchQueries: [LIST_TODOS],
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
  const [createTodo, { loading, error, data }] =
    useMutation<CreateTodoResponse>(CREATE_TODO, {
      refetchQueries: [LIST_TODOS],
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
                      title: value,
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
