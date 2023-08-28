const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let database = null;
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http:3000.localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertingToResponsiveObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//functions for api-1;
const hasStatusProperty = (requestQuery) => {
  //scenario-1
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  //scenario-2
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatusProperty = (requestQuery) => {
  //scenario-3
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryAndStatusProperty = (requestQuery) => {
  //scenario-5
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
priorityArray = ["HIGH", "MEDIUM", "LOW"];
statusArray = ["TO DO", "IN PROGRESS", "DONE"];
categoryArray = ["WORK", "HOME", "LEARNING"];
//api for getting todos based on query parameters;
app.get("/todos/", async (request, response) => {
  const { search_q = "", category, priority, status } = request.query;
  let Query1 = "";
  if (
    priorityArray.includes(priority) &&
    statusArray.includes(status) &&
    categoryArray.includes(category)
  ) {
    switch (true) {
      case hasStatusProperty(requestQuery):
        Query1 = `select * from todo
               where status = '${status}' and todo like '%${search_q}%';`;
        break;
      case hasPriorityProperty(requestQuery):
        Query1 = `select * from todo where todo like '%${search_q}%'
                and priority = '${priority}';`;
        break;
      case hasCategoryProperty(requestQuery):
        Query1 = `select * from todo where todo like '%${search_q}%'
                and category = '${category}';`;
        break;
      case hasPriorityAndStatusProperty(requestQuery):
        Query1 = `select * from todo where todo like '%${search_q}%'
                and priority = '${priority}' and status = '${status}';`;
        break;
      case hasCategoryAndStatusProperty(requestQuery):
        Query1 = `select * from todo where todo like '%${search_q}%'
                and category = '${category}' and status = '${status}';`;
        break;
      case hasCategoryAndPriorityProperty(requestQuery):
        Query1 = `select * from todo where todo like '%${search_q}%'
                and category = '${category}' and priority = '${priority}';`;
      default:
        Query1 = `select * from todo where todo like '%${search_q}%';`;
        break;
    }
  } else {
    if (priorityArray.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
    if (statusArray.includes(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    }
    if (categoryArray.includes(category) === false) {
      response.send(400);
      response.send("Invalid Todo Category");
    }
  }
  const response1 = await database.all(Query1);
  response.send(
    response1.map((eachTodo) => convertingToResponsiveObject(eachTodo))
  );
});

//api for getting todo based on its id;
app.get("/todos/:todoId/", async (request, response) => {
  const { todoID } = request.params;
  const Query2 = `select * from todo where id = ${todoId};`;
  const response2 = await database.get(Query2);
  response.send(convertingToResponsiveObject(response2));
});

//returning a todo based on deuDate;
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateObj = new Date(date);
  const formattedDate = format(new Date(date), "YYYY-MM-DD");
  const result = toDate(
    new Date(
      `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`
    )
  );
  const validDate = await isValid(result);
  if (validDate === true) {
    date = formattedDate;
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
  const Query3 = `select * from todo where due_date = '${date}';`;
  const response3 = await database.get(Query3);
  response.send(
    response3.map((eachTodo) => convertingToResponsiveObject(eachTodo))
  );
});

//creating a todo;
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const Query4 = `insert into todo(id,todo,priority,status,category,due_date) 
    values(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await database.run(Query4);
  response.send("Todo Successfully Added");
});

//updating todo;
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, status, category, priority, dueDate } = request.body;
  let updateColumn = "";
  let Query4 = "";
  switch (true) {
    case todo !== undefined:
      updateColumn = "Todo";
      break;
    case status !== undefined:
      if (statusArray.includes(status)) {
        updateColumn = "Status";
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (priorityArray.includes(priority)) {
        updateColumn = "Priority";
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case category !== undefined:
      if (categoryArray.includes(category)) {
        updateColumn = "Category";
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case dueDate !== undefined:
      const myDate = new Date(dueDate);
      const formattedDate = format(new Date(dueDate), "YYYY-MM-DD");
      const result = toDate(new Date(formattedDate));
      const isValidDate = isValid(result);
      if (isValidDate === true) {
        dueDate = formattedDate;
        updateColumn = "Due Date";
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
  const Query5 = `update todo set todo = '${todo}',
    status = '${status}' and category = '${category}' and priority = '${priority}'
    and due_date = '${dueDate}' where id = ${todoId};`;
  await database.run(Query5);
  response.send(`${updateColumn} Updated`);
});

//deleting a todo based on its id;
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoID } = request.params;
  const Query6 = `delete from todo where id = ${todoId};`;
  await database.run(Query6);
  response.send("Todo Deleted");
});

module.exports = app;
