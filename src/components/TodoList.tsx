import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { List } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

export type TodoItem = {
  text: string;
  description: string;
  url: string;
  priority: 1 | 2 | 3;
  done: boolean;
  notes: string;
};

type TodoBucket = "important" | "secondary" | "backburner";

type TodoTree = {
  important: TodoItem[];
  secondary: TodoItem[];
  backburner: TodoItem[];
};

export const TodoList = ({ todos }: { todos: TodoItem[] }) => {
  const [todoTree, setTodoTree] = useState<TodoTree>({
    important: [],
    secondary: [],
    backburner: [],
  });

  useEffect(() => {
    const newTodos: TodoTree = { important: [], secondary: [], backburner: [] };
    todos.forEach((todo) => {
      if (todo.priority === 1) {
        newTodos.important.push(todo);
      } else if (todo.priority === 2) {
        newTodos.secondary.push(todo);
      } else {
        newTodos.backburner.push(todo);
      }
    });
    setTodoTree(newTodos);
  }, []);

  const handleCheckboxChange = (category: TodoBucket, index: number) => {
    setTodoTree((prevState) => {
      const newTodos = { ...prevState };
      newTodos[category][index].done = !prevState[category][index].done;
      return newTodos;
    });
  };

  const renderTodoList = (category: TodoBucket, description: string) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{category.toUpperCase()}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="w-full">
        <div className="flex flex-col space-y-2">
          {todoTree[category]?.map((todo, index) => (
            <div className="flex flex-col space-x-4 space-y-1">
              <div key={`${category}-${index}`} className="flex items-center space-x-4">
                <Checkbox checked={todo.done} onCheckedChange={() => handleCheckboxChange(category, index)} />
                <Label className="text-sm" htmlFor={`todo-${category}-${index}`}>
                  {todo.text} -{" "}
                  <a
                    href={todo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline hover:text-blue-700"
                  >
                    link
                  </a>
                </Label>
              </div>
              <div className="pl-4 text-xxs text-gray-600">{todo.notes}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (!todoTree) return null;

  return (
    <div className="todo-list">
      {renderTodoList("important", "Tasks that likely need to get done today.")}
      {renderTodoList("secondary", "Tasks that are important but not urgent.")}
      {renderTodoList("backburner", "Tasks that can wait.")}
    </div>
  );
};
