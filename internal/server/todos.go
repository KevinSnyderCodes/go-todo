package server

import (
	"context"
	"database/sql"
	"fmt"

	postgresdb "github.com/kevinsnydercodes/go-todo/internal/database/postgres"
	"github.com/kevinsnydercodes/go-todo/internal/proto"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type TodosV1 struct {
	queries *postgresdb.Queries

	proto.UnimplementedTodosV1Server
}

type GetTodoRequest proto.GetTodoRequest

func (o *GetTodoRequest) Validate() error {
	// TODO: Implement
	return nil
}

func (o *TodosV1) GetTodo(ctx context.Context, req *proto.GetTodoRequest) (*proto.GetTodoResponse, error) {
	if err := (*GetTodoRequest)(req).Validate(); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid request: %v", err)
	}

	todo, err := o.queries.GetTodo(ctx, req.GetId())
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Error(codes.NotFound, "todo not found")
		}
		return nil, fmt.Errorf("error getting todo: %w", err)
	}

	return &proto.GetTodoResponse{
		Todo: (*TodoDB)(&todo).TodoProto(),
	}, nil
}

type ListTodosRequest proto.ListTodosRequest

func (o *ListTodosRequest) Validate() error {
	// TODO: Implement
	return nil
}

func (o *TodosV1) ListTodos(ctx context.Context, req *proto.ListTodosRequest) (*proto.ListTodosResponse, error) {
	if err := (*ListTodosRequest)(req).Validate(); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid request: %v", err)
	}

	todos, err := o.queries.ListTodos(ctx)
	if err != nil {
		return nil, fmt.Errorf("error listing todos: %w", err)
	}

	return &proto.ListTodosResponse{
		Todos: (TodosDB)(todos).TodosProto(),
	}, nil
}

type CreateTodoRequest proto.CreateTodoRequest

func (o *CreateTodoRequest) Validate() error {
	if o == nil {
		return fmt.Errorf("request is nil")
	}

	if o.Todo == nil {
		return fmt.Errorf("todo is required")
	}

	if o.Todo.Title == "" {
		return fmt.Errorf("todo title is required")
	}

	return nil
}

func (o *TodosV1) CreateTodo(ctx context.Context, req *proto.CreateTodoRequest) (*proto.CreateTodoResponse, error) {
	if err := (*CreateTodoRequest)(req).Validate(); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid request: %v", err)
	}

	todo, err := o.queries.CreateTodo(ctx, req.GetTodo().GetTitle())
	if err != nil {
		return nil, fmt.Errorf("error creating todo: %w", err)
	}

	return &proto.CreateTodoResponse{
		Todo: (*TodoDB)(&todo).TodoProto(),
	}, nil
}

type DeleteTodoRequest proto.DeleteTodoRequest

func (o *DeleteTodoRequest) Validate() error {
	// TODO: Implement
	return nil
}

func (o *TodosV1) DeleteTodo(ctx context.Context, req *proto.DeleteTodoRequest) (*proto.DeleteTodoResponse, error) {
	if err := (*DeleteTodoRequest)(req).Validate(); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid request: %w", err)
	}

	if err := o.queries.DeleteTodo(ctx, req.GetId()); err != nil {
		return nil, fmt.Errorf("error deleting todo: %w", err)
	}

	return &proto.DeleteTodoResponse{}, nil
}

func NewTodosV1(queries *postgresdb.Queries) *TodosV1 {
	return &TodosV1{
		queries: queries,
	}
}

type TodoDB postgresdb.Todo

func (o *TodoDB) TodoProto() *proto.Todo {
	return &proto.Todo{
		Id:    o.ID,
		Title: o.Title,
	}
}

type TodosDB []postgresdb.Todo

func (o TodosDB) TodosProto() []*proto.Todo {
	todos := make([]*proto.Todo, len(o))
	for i, todo := range o {
		todos[i] = (*TodoDB)(&todo).TodoProto()
	}
	return todos
}

type TodoProto proto.Todo

func (o *TodoProto) TodoDB() postgresdb.Todo {
	return postgresdb.Todo{
		ID:    o.Id,
		Title: o.Title,
	}
}
