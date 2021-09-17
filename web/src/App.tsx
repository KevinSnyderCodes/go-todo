import React, { useState, useEffect } from "react";
import {
  Checkbox,
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
// import './App.css';

type Todo = {
  id: number;
  title: string;
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  const getTodos = async () => {
    const response = await fetch("http://localhost:8080/api/v1/todos");
    const data = await response.json();
    setTodos(data.todos);
  };

  const createTodo = async (title: string) => {
    const response = await fetch("http://localhost:8080/api/v1/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        todo: {
          title,
        },
      }),
    });
    const data = await response.json();
    setTodos([...todos, data.todo]);
  };

  const deleteTodo = async (id: number) => {
    const response = await fetch(`http://localhost:8080/api/v1/todos/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  useEffect(() => {
    getTodos();
  }, []);

  return (
    <Container>
      <Paper>
        <List>
          {todos.map((todo) => (
            <ListItem
              key={todo.id}
              secondaryAction={
                <IconButton
                  onClick={() => {
                    deleteTodo(todo.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton>
                <ListItemIcon>
                  <Checkbox />
                </ListItemIcon>
                <ListItemText primary={todo.title} />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem>
            <FormControl>
              <TextField
                fullWidth
                label="Enter a todo..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createTodo(input);
                    setInput("");
                  }
                }}
              />
            </FormControl>
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
}

export default App;
