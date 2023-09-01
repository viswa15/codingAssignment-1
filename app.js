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
      console.log("Server running at http://localhost:3000/");
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
const hasDueDateProperty = (requestQuery) => {
  return requestQuery.date !== undefined;
};
priorityArray = ["HIGH", "MEDIUM", "LOW"];
statusArray = ["TO DO", "IN PROGRESS", "DONE"];
categoryArray = ["WORK", "HOME", "LEARNING"];
//api for getting todos based on query parameters;
app.get("/todos/", async (request, response) => {
  const { search_q = "", category, priority, status } = request.query;
  let requestQuery = request.query;
  let Query1 = "";
  switch (true) {
    case hasStatusProperty(requestQuery):
      if (statusArray.includes(status) === true) {
        Query1 = `select * from todo
               where status = '${status}' and todo like '%${search_q}%';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      }
      break;
    case hasPriorityProperty(requestQuery):
      if (priorityArray.includes(priority) === true) {
        Query1 = `select * from todo where todo like '%${search_q}%'
                and priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      }
      break;
    case hasCategoryProperty(requestQuery):
      if (categoryArray.includes(category) === true) {
        Query1 = `select * from todo where todo like '%${search_q}%'
                and category = '${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      }
      break;
    case hasPriorityAndStatusProperty(requestQuery):
      if (
        priorityArray.includes(priority) === true &&
        statusArray.includes(status) === true
      ) {
        Query1 = `select * from todo where todo like '%${search_q}%'
                and priority = '${priority}' and status = '${status}';`;
      }
      if (priorityArray.includes(priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      }
      break;
    case hasCategoryAndStatusProperty(requestQuery):
      if (
        categoryArray.includes(category) === true &&
        statusArray.includes(status) === true
      ) {
        Query1 = `select * from todo where todo like '%${search_q}%'
                and category = '${category}' and status = '${status}';`;
      }
      if (categoryArray.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      } else {
        response.send(400);
        response.send("Invalid Todo Status");
        return;
      }
      break;
    case hasCategoryAndPriorityProperty(requestQuery):
      if (
        categoryArray.includes(category) === true &&
        priorityArray.includes(priority) === true
      ) {
        Query1 = `select * from todo where todo like '%${search_q}%'
                and category = '${category}' and priority = '${priority}';`;
      }
      if (categoryArray.includes(category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      }

    default:
      Query1 = `select * from todo where todo like '%${search_q}%';`;
      break;
  }
  const response1 = await database.all(Query1);
  response.send(
    response1.map((eachTodo) => convertingToResponsiveObject(eachTodo))
  );
});

//api for getting todo based on its id;
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const Query2 = `select * from todo where id = ${todoId};`;
  const response2 = await database.get(Query2);
  response.send(convertingToResponsiveObject(response2));
});

//returning a todo based on deuDate;
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let requestQuery = request.query;
  if (hasDueDateProperty(requestQuery) === true) {
    const myDate = new Date(date);
    console.log(myDate);
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    console.log(formattedDate);
    const result = toDate(
      new Date(
        `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
      )
    );
    console.log(result);
    const isValidDate = isValid(result);
    if (isValidDate === true) {
      const Query3 = `select * from todo where due_date = '${formattedDate}';`;
      const response3 = await database.all(Query3);
      if (response3 === undefined) {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      } else {
        response.send(
          response3.map((eachTodo) => convertingToResponsiveObject(eachTodo))
        );
      }
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
    return;
  }
});

//creating a todo;
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const requestBody = request.body;
  switch (true) {
    case priorityArray.includes(priority) === false:
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
      break;
    case statusArray.includes(status) === false:
      response.status(400);
      response.send("Invalid Todo Status");
      return;
      break;
    case categoryArray.includes(category) === false:
      response.status(400);
      response.send("Invalid Todo Category");
      return;
      break;
    case dueDate !== undefined:
      const myDate = new Date(dueDate);
      const formattedDate = format(myDate, "yyyy-MM-dd");
      const result = toDate(new Date(formattedDate));
      const isValid = isValid(result);
      if (isValid === true) {
        requestBody.dueDate = formattedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
      break;
  }
  const Query4 = `insert into todo(id,todo,category,priority,status,due_date)
   values(${id},'${todo}','${category}','${priority}','${status}','${dueDate}');`;
  await database.run(Query4);
  response.send("Todo Successfully Added");
});

//updating todo;
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, status, category, priority, dueDate } = request.body;
  const requestBody = request.body;
  let updateColumn = "";
  let Query5 = "";
  try {
    switch (true) {
      case todo !== undefined:
        updateColumn = "Todo";
        Query5 = `update todo set todo = '${todo}' where id=${todoId};`;
        break;
      case status !== undefined:
        if (statusArray.includes(requestBody.status) === true) {
          updateColumn = "Status";
          Query5 = `update todo set status = '${status}' where id = ${todoId};`;
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
          return;
        }
        break;
      case priority !== undefined:
        if (priorityArray.includes(requestBody.priority) === true) {
          updateColumn = "Priority";
          Query5 = `update todo set priority ='${priority}' where id = ${todoId};`;
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
          return;
        }
        break;
      case category !== undefined:
        if (categoryArray.includes(requestBody.category) === true) {
          updateColumn = "Category";
          Query5 = `update todo set category = '${category}' where id = ${todoId};`;
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
          return;
        }
        break;
      case dueDate !== undefined:
        const myDate = new Date(dueDate);
        const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
        const result = toDate(new Date(formattedDate));
        const isValidDate = isValid(result);
        if (isValidDate === true) {
          request.dueDate = formattedDate;
          updateColumn = "Due Date";
          Query5 = `update todo set due_date = '${dueDate}' where id=${todoId};`;
        } else {
          response.status(400);
          response.send("Invalid Due Date");
          return;
        }
        break;
    }
    await database.run(Query5);
    response.send(`${updateColumn} Updated`);
  } catch (e) {
    response.send(400);
    response.status("Invalid {updateColumn}");
    return;
  }
});

//deleting a todo based on its id;
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const Query6 = `delete from todo where id=${todoId};`;
  await database.run(Query6);
  response.send("Todo Deleted");
});

module.exports = app;
